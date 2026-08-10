// Fee-label coverage — every charge id, every service area and every ride tier
// `getFeeSchedule` publishes has site-authored EN/ES copy, or the deploy fails.
// Wayfinder #56; the rule is docs/copy-map.md §6.2, extended to service areas
// by #47 and to ride tiers by #65.
//
// Unlike the other two gates this one is NOT offline and NOT dumb: it asks the
// endpoint what it is publishing right now. That is the whole point — the ids
// live in Firestore documents in another system, so nothing in this repo can
// answer the question. #41 filed the check and could not build it for exactly
// this reason.
//
// WHERE IT RUNS, and why not in `npm run build` (#56's first sub-question):
// putting a network call in `npm run checks` would make every local build and
// every PR depend on a third-party function being up, which is the opposite of
// the dependency-free rule the other two follow. It runs instead
//   - on deploy (deploy-all.yml), where PUBLIC_FEE_SCHEDULE_URL already exists;
//   - daily on a schedule (fee-label-drift.yml), because drift is introduced
//     upstream — someone files a new charge in the admin console — and this site
//     deploys rarely. Deploy-time-only checking would let /es/fees leak English
//     for weeks between releases.
//
// FAILS ON DRIFT, SKIPS WHEN IT CANNOT ASK. An id the site cannot name is a real
// defect this repo can fix, and it blocks the deploy. An endpoint that did not
// answer is not — blocking an unrelated content fix on someone else's uptime
// would be the wrong trade, and a schedule the page cannot fetch already renders
// /fees' designed error state rather than a wrong number.
//
// WHAT IT CANNOT DO: it checks that a label EXISTS, never that it is right.
// `family` and `payer` are editorial — neither is a database field — so for a new
// id this can only say that a human must classify it.

import { readFileSync, existsSync } from "node:fs";

const LABELS = "src/i18n/feeLabels.ts";
const SERVICE_AREA = "src/lib/serviceArea.ts";
const TIMEOUT_MS = 10_000;

// The same variable the site is built against, so the check reads exactly the
// data the shipped page will fetch. An argument overrides it for manual runs
// against another environment.
//
// WHY THIS READS .env ITSELF RATHER THAN THROUGH VITE (#72). `check-env.mjs`
// reads the environment through Vite's own `loadEnv` — .env, .env.local,
// .env.production, .env.production.local, then process.env — and its header
// argues that re-implementing that precedence "would be a second answer to a
// question that already has one, free to drift from it". `fromDotEnv` is that
// second answer. It is kept, deliberately, and these are the three facts that
// make it cheap rather than dangerous:
//
//   - It cannot import Vite. This script runs in deploy-all.yml BEFORE `npm ci`
//     so that label drift fails the deploy before two minutes go on a registry
//     install. Running it after the install would make a network-only check
//     wait on the private registry, and a registry outage would then block a
//     check that never needed one.
//   - Neither CI path ever reaches it. deploy-all.yml and fee-label-drift.yml
//     both hand PUBLIC_FEE_SCHEDULE_URL to this step in its own `env:` block,
//     so `process.env` answers first and `fromDotEnv` is unreachable in CI.
//     The divergence is local-only; the deploy gate does not depend on it.
//   - Locally it degrades loudly. Keys kept in .env.local — which .gitignore
//     advertises as a supported input — are invisible to it, and the run then
//     prints SKIPPED and "Nothing was checked" rather than a green tick.
//
// What it does NOT do is claim to agree with the build. A URL the two readers
// disagree on would have this check verify one endpoint while the build ships
// another, and say nothing. So every run PRINTS WHERE THE URL CAME FROM: the
// failure this script exists to refuse is success-shaped output over something
// that was never checked, and that includes checking the wrong thing.
const [endpoint, endpointFrom] = resolveEndpoint();

function resolveEndpoint() {
  if (process.argv[2]) return [process.argv[2], "the command-line argument"];
  if (process.env.PUBLIC_FEE_SCHEDULE_URL)
    return [process.env.PUBLIC_FEE_SCHEDULE_URL, "PUBLIC_FEE_SCHEDULE_URL in the environment"];
  return [fromDotEnv(), ".env — this reader ignores .env.local and the mode files (#72)"];
}

function fromDotEnv() {
  if (!existsSync(".env")) return "";
  const line = readFileSync(".env", "utf8")
    .split("\n")
    .find((l) => l.startsWith("PUBLIC_FEE_SCHEDULE_URL="));
  return line ? line.slice(line.indexOf("=") + 1).trim() : "";
}

function skip(why) {
  console.log(`- fee labels SKIPPED — ${why}`);
  // A skip that does not say which URL it failed to reach cannot be told from a
  // skip that reached the wrong one (#72).
  if (endpoint) console.log(`  asked ${endpoint}, URL from ${endpointFrom}`);
  console.log(`  Nothing was checked: ids the site cannot name would not be seen.`);
  process.exit(0);
}

/** One capture group out of a source file, or throw. Fails CLOSED on purpose:
 *  a reader that shrugs and returns "" would turn a renamed constant into a
 *  silent pass, which is the failure mode this whole script exists to refuse
 *  (#59's review found exactly that bug in a source reader). */
function matchOne(src, re, what) {
  const m = re.exec(src);
  if (!m) throw new Error(`could not read ${what} — has it been renamed?`);
  return m[1];
}

/** Top-level keys of an exported object literal, read out of the TypeScript
 *  source. Reading source text is what the other two gates do; it keeps this
 *  dependency-free and avoids compiling TS to learn four strings. */
function objectKeys(src, exportName) {
  const decl = new RegExp(`export const ${exportName}\\b[^=]*=\\s*\\{`).exec(src);
  if (!decl) throw new Error(`${LABELS} has no "export const ${exportName}"`);

  let depth = 0;
  let top = ""; // depth-1 text only; nested objects collapse to nothing
  let str = null;
  for (let i = decl.index + decl[0].length - 1; i < src.length; i++) {
    const c = src[i];
    if (str) {
      // Quoted keys are keys — `"us-fl-south-florida":` has to survive the skip.
      // Punctuation inside the quotes is neutralised so a string value can never
      // look like the start of another entry.
      if (depth === 1) top += /[,:{}]/.test(c) ? " " : c;
      if (c === "\\") i++;
      else if (c === str) str = null;
      continue;
    }
    // Comments are skipped, not scanned. They are prose: an apostrophe in
    // "the driver's side" would otherwise open a string that never closes, and
    // a comment between two entries would hide the second key from the match.
    if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i === -1) break;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1) break;
      i = end + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      str = c;
      if (depth === 1) top += c;
      continue;
    }
    if (c === "{") {
      depth++;
      continue;
    }
    if (c === "}") {
      depth--;
      if (depth === 0) break;
      continue;
    }
    if (depth === 1) top += c;
  }
  if (depth !== 0) throw new Error(`${LABELS}: ${exportName} literal is unbalanced`);

  return new Set(
    [...top.matchAll(/(?:^|,)\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:/g)].map(
      (m) => m[1] ?? m[2] ?? m[3],
    ),
  );
}

async function get(url) {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`responded ${res.status}`);
  return res.json();
}

if (!endpoint) {
  skip(
    "PUBLIC_FEE_SCHEDULE_URL is not set — .env.local and the mode files are not read here (#72), " +
      "so export it or pass a URL as an argument to run this by hand",
  );
}

const source = readFileSync(LABELS, "utf8");
const knownCharges = objectKeys(source, "feeLabels");
const knownAreas = objectKeys(source, "serviceAreaNames");
const knownServices = objectKeys(source, "serviceLabels");

let index;
try {
  index = await get(endpoint);
} catch (e) {
  skip(`getFeeSchedule did not answer (${e.message})`);
}

// Every area, not just the default one: charge ids are per-area subcollections,
// so checking one area checks one area (#56's second sub-question). The picker
// offers all of them, so the site has to be able to name all of them.
const areas = Array.isArray(index.areas) && index.areas.length ? index.areas : [index.area];
const charges = new Map(); // id -> { description, areas: [] }
const services = new Map(); // id -> { name, areas: [] }
const unreachable = [];

for (const area of areas) {
  let schedule = area.id === index.area?.id ? index : null;
  if (!schedule) {
    const url = new URL(endpoint);
    url.searchParams.set("area", area.id);
    try {
      schedule = await get(url);
    } catch (e) {
      unreachable.push(`${area.id} (${e.message})`);
      continue;
    }
  }
  for (const c of schedule.appCharges ?? []) {
    if (!charges.has(c.id)) charges.set(c.id, { description: c.description, areas: [] });
    charges.get(c.id).areas.push(area.id);
  }
  // Ride tiers are a per-area subcollection like charges, so the same
  // every-area rule applies: an area can offer a tier no other area does
  // (stage's Detroit publishes only `comfort`). Checking one area would miss it.
  //
  // `getFeeSchedule` is the only endpoint asked, and that also covers
  // /fare-estimate — the second page #65 found the leak on — because both read
  // the SAME subcollection UNFILTERED, so their id sets agree: yeride-functions
  // `lib/fee-schedule.js` `toRideService` maps every `rideServices` doc, and
  // `handlers/estimate-fares.js` L358 does
  // `serviceAreaRef.collection("rideServices").get()`.
  //
  // The IDS, though — not the prose. `getFeeSchedule` publishes no
  // `description` field at all, so nothing here can compare the tier blurb
  // /fare-estimate renders against the operator's current wording. A NEW tier
  // fails below and its entry carries both fields; a REWORDED blurb is invisible.
  for (const s of schedule.rideServices ?? []) {
    if (!services.has(s.id)) services.set(s.id, { name: s.name, areas: [] });
    services.get(s.id).areas.push(area.id);
  }
}

const errors = [];
const missingCharges = [];
const missingAreas = [];
const missingServices = [];

for (const [id, { description, areas: seenIn }] of charges) {
  if (knownCharges.has(id)) continue;
  missingCharges.push(id);
  errors.push(
    `charge id "${id}" is published in ${seenIn.join(", ")} and ${LABELS} does not cover it\n` +
      `      the endpoint calls it "${description}", which is what /es/fees would print — in English\n` +
      `      and because an unclassified charge lands on neither side of the ledger, /fees withholds\n` +
      `      its example entirely until this is fixed`,
  );
}

for (const [id, { name, areas: seenIn }] of services) {
  if (knownServices.has(id)) continue;
  missingServices.push(id);
  errors.push(
    `service id "${id}" is published in ${seenIn.join(", ")} and ${LABELS} does not cover it\n` +
      `      the endpoint calls it "${name}", which is what both languages would print — English\n` +
      `      in the rate card's name column on /es/fees, and as the tier heading on\n` +
      `      /es/fare-estimate, whose blurb has no fallback copy at all`,
  );
}

for (const area of areas) {
  if (knownAreas.has(area.id)) continue;
  missingAreas.push(area.id);
  errors.push(
    `service area "${area.id}" is offered by the picker and ${LABELS} does not cover it\n` +
      `      both languages would fall back to the humanised identifier`,
  );
}

// The one area /fare-estimate hard-codes must still be one the endpoint serves
// (#62). Unlike a stale LABEL — harmless, and only a notice below — a stale
// DEFAULT_SERVICE_AREA_ID is a live defect: `estimateFares` throws `not-found`
// for every rider on the page while the page keeps naming the area it priced
// for, because that line is server-rendered and stands in every state by
// design. Nothing else checks it; the id is written in three places that no
// one derives from the others (here, the site constant, and yeride-functions'
// own DEFAULT_AREA_ID), so drift is silent everywhere else.
const defaultArea = matchOne(
  readFileSync(SERVICE_AREA, "utf8"),
  /DEFAULT_SERVICE_AREA_ID\s*=\s*"([^"]+)"/,
  `DEFAULT_SERVICE_AREA_ID in ${SERVICE_AREA}`,
);
const defaultAreaUnserved = !areas.some((a) => a.id === defaultArea);
if (defaultAreaUnserved) {
  errors.push(
    `/fare-estimate prices every fare for "${defaultArea}" and getFeeSchedule does not serve it\n` +
      `      it offers ${areas.map((a) => a.id).join(", ") || "no areas at all"}\n` +
      `      so estimateFares answers not-found for every rider while the page still names it`,
  );
}

const stale = [...knownCharges].filter((id) => !charges.has(id));
const staleServices = [...knownServices].filter((id) => !services.has(id));
const scope =
  `${charges.size} charge id${charges.size === 1 ? "" : "s"}, ` +
  `${services.size} service id${services.size === 1 ? "" : "s"} across ` +
  `${areas.length - unreachable.length}/${areas.length} area${areas.length === 1 ? "" : "s"}`;

if (errors.length) {
  console.error(`✗ fee labels (${scope})`);
  for (const e of errors) console.error(`  ${e}`);
  // Each hint names the cause it actually belongs to. An unconditional hint is
  // a wrong cause named for every other failure — the fault this repo has
  // re-opened tickets over (#47, #57, #59).
  if (missingCharges.length || missingAreas.length || missingServices.length) {
    console.error(`\n  All three maps are in ${LABELS}.`);
  }
  if (missingCharges.length) {
    console.error(`  A charge needs an EN and an ES label, a "family" and a "payer". Neither family`);
    console.error(`  nor payer is a database field, so both are editorial decisions a human has to`);
    console.error(`  make: getting them wrong states something false about YeRide's economics on`);
    console.error(`  the page that exists to be trusted about them (copy-map §2.3).`);
  }
  if (missingAreas.length) {
    console.error(`  An area needs a display name in both languages — it is brand copy, not data (#47).`);
  }
  if (missingServices.length) {
    console.error(`  A ride tier needs an EN and an ES name and blurb. The tiers are copy, not brand`);
    console.error(`  names (#65): the brand package names no tier anywhere, so there is nothing to`);
    console.error(`  keep in English. EN is authored too — it is what the app shows a rider.`);
  }
  if (defaultAreaUnserved) {
    console.error(`  The area /fare-estimate prices for is ${SERVICE_AREA}, and it is not a label —`);
    console.error(`  naming it here would not help. Either the area moved and the constant follows it,`);
    console.error(`  or it should not have moved (#62).`);
  }
  console.error(`  Endpoint: ${endpoint}`);
  console.error(`  URL from: ${endpointFrom}`);
  process.exit(1);
}

console.log(`✓ fee labels (${scope})`);
// Which endpoint was actually asked, and on whose authority (#72). A green tick
// over the wrong URL is the one way this check can be success-shaped and empty.
console.log(`  asked ${endpoint}`);
console.log(`  URL from ${endpointFrom}`);
for (const u of unreachable) console.log(`  area not checked: ${u}`);
// Not a failure: an unused label renders nothing, and prod and stage legitimately
// publish different areas, so the same source would fight itself between them.
for (const id of stale) console.log(`  unused label: "${id}" — no area publishes it any more`);
for (const id of staleServices)
  console.log(`  unused service label: "${id}" — no area publishes it any more`);
