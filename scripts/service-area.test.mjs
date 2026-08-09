// Controls for `src/lib/serviceArea.ts` — READ THIS WHENEVER THAT FILE CHANGES
// (#73).
//
// It decides whether a rider is quoted a fare at all, and which market's rates
// price it. Three of its rules are easy to write, easy to get subtly wrong, and
// silent when wrong:
//
//   1. the boundary is INCLUSIVE, matching yeride-mobile;
//   2. on overlap the FIRST area in document-id order wins, whatever order the
//      wire happened to use;
//   3. "outside" requires EVERY area to publish a usable circle — the rule that
//      stops §3.5's "We're not in that area yet." from firing off missing data.
//
// Rule 3 is the one worth the file. Every other outcome here is wrong by a
// number; that one is wrong by a SENTENCE, telling a rider YeRide does not
// serve them because an admin left a field blank.
//
// It imports the REAL module — not a copy — via node's type stripping, for the
// reason #83 gives at length: a control that re-implements what it tests passes
// while the shipped code is broken. That is also why the second block below
// uses PRODUCTION's live circle rather than a round fixture: the numbers a
// rider actually meets are the ones worth pinning.
//
// Plain node, no dependencies, no runner — `scripts/copy-gate-patterns.test.mjs`
// is the precedent. Run: `node --experimental-strip-types scripts/service-area.test.mjs`

import { resolveServiceArea } from "../src/lib/serviceArea.ts";

let failures = 0;
let checks = 0;

function check(label, actual, expected) {
  checks++;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.error(`  ✗ ${label}\n      expected ${e}\n      actual   ${a}`);
  }
}

// A circle with a 100 km radius on the equator at (0,0), where a degree of
// longitude is at its longest and the arithmetic is easiest to reason about.
const EQ = { id: "b-equator", center: { lat: 0, lng: 0 }, radiusMeters: 100_000 };

// Production's real South Florida circle, read off `getFeeSchedule` 2026-08-09.
const SFL = {
  id: "us-fl-south-florida",
  center: { lat: 26.148822, lng: -80.273657 },
  radiusMeters: 93_000,
};

console.log("serviceArea: the point");
check("a point at the exact centre is inside", resolveServiceArea(EQ.center, [EQ]), {
  kind: "inside",
  areaId: "b-equator",
});
check(
  "no pickup is unknown, never outside",
  resolveServiceArea(null, [EQ]),
  { kind: "unknown" },
);
check(
  "a NaN coordinate is unknown, never outside",
  resolveServiceArea({ lat: Number.NaN, lng: 0 }, [EQ]),
  { kind: "unknown" },
);
check(
  "a latitude past the pole is not a place",
  resolveServiceArea({ lat: 91, lng: 0 }, [EQ]),
  { kind: "unknown" },
);

console.log("serviceArea: the boundary is inclusive");
// 100 km due north of the equator, using the module's own earth radius, so this
// lands ON the boundary rather than near it.
const R = 6_371_000;
const degForMeters = (m) => (m / R) * (180 / Math.PI);
check(
  "exactly on the boundary is INSIDE (matches ServiceArea.containsPoint)",
  resolveServiceArea({ lat: degForMeters(100_000), lng: 0 }, [EQ]),
  { kind: "inside", areaId: "b-equator" },
);
check(
  "one metre beyond the boundary is outside",
  resolveServiceArea({ lat: degForMeters(100_001), lng: 0 }, [EQ]),
  { kind: "outside" },
);

console.log("serviceArea: production's South Florida circle (93 km)");
const inside = {
  "Fort Lauderdale": { lat: 26.1224, lng: -80.1373 },
  Miami: { lat: 25.7617, lng: -80.1918 },
  "MIA airport": { lat: 25.7959, lng: -80.287 },
  "West Palm Beach": { lat: 26.7153, lng: -80.0534 },
  Homestead: { lat: 25.4687, lng: -80.4776 },
};
const outside = {
  "Key Largo": { lat: 25.0865, lng: -80.4473 },
  Naples: { lat: 26.142, lng: -81.7948 },
  "Key West": { lat: 24.5551, lng: -81.78 },
  Orlando: { lat: 28.5383, lng: -81.3792 },
  // #62's own example of the bug this ticket closes: a Chicago pickup used to
  // be quoted South Florida rates as a real fare.
  Chicago: { lat: 41.8781, lng: -87.6298 },
  Havana: { lat: 23.1136, lng: -82.3666 },
};
for (const [name, p] of Object.entries(inside)) {
  check(`${name} is inside`, resolveServiceArea(p, [SFL]), {
    kind: "inside",
    areaId: "us-fl-south-florida",
  });
}
for (const [name, p] of Object.entries(outside)) {
  check(`${name} is outside`, resolveServiceArea(p, [SFL]), { kind: "outside" });
}

console.log("serviceArea: overlap tie-break is document-id order, not wire order");
const REGION = { id: "a-region", center: { lat: 0, lng: 0 }, radiusMeters: 200_000 };
const CITY = { id: "b-city", center: { lat: 0, lng: 0 }, radiusMeters: 50_000 };
check(
  "both contain the point — lowest id wins",
  resolveServiceArea({ lat: 0, lng: 0 }, [REGION, CITY]),
  { kind: "inside", areaId: "a-region" },
);
check(
  "…and still wins when the wire lists them the other way round",
  resolveServiceArea({ lat: 0, lng: 0 }, [CITY, REGION]),
  { kind: "inside", areaId: "a-region" },
);
check(
  "a nested area is reachable when the outer one does not contain the point",
  resolveServiceArea({ lat: degForMeters(150_000), lng: 0 }, [CITY, REGION]),
  { kind: "inside", areaId: "a-region" },
);

console.log("serviceArea: an unusable circle means UNKNOWN, never OUTSIDE");
const NO_CIRCLE = { id: "c-nocircle" };
check(
  "no areas at all",
  resolveServiceArea({ lat: 0, lng: 0 }, []),
  { kind: "unknown" },
);
check(
  "a null list (the fetch failed)",
  resolveServiceArea({ lat: 0, lng: 0 }, null),
  { kind: "unknown" },
);
check(
  "🔴 one area lacks a circle and the point is in no other — UNKNOWN",
  resolveServiceArea({ lat: 40, lng: 40 }, [EQ, NO_CIRCLE]),
  { kind: "unknown" },
);
check(
  "…but a HIT still wins over an unreadable sibling",
  resolveServiceArea({ lat: 0, lng: 0 }, [EQ, NO_CIRCLE]),
  { kind: "inside", areaId: "b-equator" },
);
check(
  "an explicitly null circle is the same as an absent one",
  resolveServiceArea({ lat: 40, lng: 40 }, [
    EQ,
    { id: "c-null", center: null, radiusMeters: null },
  ]),
  { kind: "unknown" },
);

console.log("serviceArea: a defaulted radius is not a circle");
for (const [label, radiusMeters] of [
  ["zero", 0],
  ["negative", -1],
  ["NaN", Number.NaN],
  ["Infinity", Number.POSITIVE_INFINITY],
]) {
  check(
    `a ${label} radius is unreadable, so the answer is unknown`,
    resolveServiceArea({ lat: 40, lng: 40 }, [
      { id: "d-bad", center: { lat: 0, lng: 0 }, radiusMeters },
    ]),
    { kind: "unknown" },
  );
}
check(
  "a zero radius does not even contain its own centre",
  resolveServiceArea({ lat: 0, lng: 0 }, [
    { id: "d-bad", center: { lat: 0, lng: 0 }, radiusMeters: 0 },
  ]),
  { kind: "unknown" },
);
check(
  "a radius arriving as a numeric STRING is not a number",
  resolveServiceArea({ lat: 0, lng: 0 }, [
    { id: "d-str", center: { lat: 0, lng: 0 }, radiusMeters: "93000" },
  ]),
  { kind: "unknown" },
);

console.log(`\n${checks} checks, ${failures} failed`);
if (failures > 0) process.exit(1);
console.log("serviceArea controls: OK");
