// Controls for the copy-map §3.4 suspension rule. Plain node, no runner, no deps:
//
//     node scripts/copy-gate-suspension.test.mjs
//
// Wayfinder #83 added this file. The rule it covers had never been proved to
// fire by anything but its author's reading, and it did not: written as
// /family:\s*"passthrough"/, it enforced §3.4 against double quotes only, and a
// charge filed as `family: 'passthrough'` would have shipped the suspended
// family-2 copy — "at cost", "insurance" — off a green build.
//
// So the first list below is the point of the file: every string literal syntax
// JavaScript has, in the quote styles this repo does NOT currently use. The
// second list is the usual harder half — a guard widened until it fires on the
// type union that merely NAMES the family, or on `family: "tech"`, would fail
// the build on correct data and get deleted.
//
// Like scripts/copy-gate-patterns.test.mjs, this lives in scripts/, which
// neither gate scans.
import { readFileSync } from "node:fs";
import { passthroughFiling, PASSTHROUGH_FILED } from "./copy-gate-suspension.mjs";

const LABELS = "src/i18n/feeLabels.ts";
let failures = 0;

const say = (ok, label, detail) => {
  if (ok) return;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
  failures++;
};

// ------------------------------------------------------------------ must fire
// A charge filed into the pass-through family, however it is written.
const FILED = [
  ["double quotes — the one style the rule used to read", `family: "passthrough",`],
  ["single quotes — #83's bypass", `family: 'passthrough',`],
  ["backticks", "family: `passthrough`,"],
  ["no space after the colon", `family:'passthrough',`],
  ["space before the colon", `family : 'passthrough',`],
  ["broken across lines", `family:\n    'passthrough',`],
  ["inside a realistic entry", `tripInsuranceFl: {\n  en: "Trip protection",\n  es: "Protección del viaje",\n  family: 'passthrough',\n  payer: "rider",\n},`],
];

// -------------------------------------------------------------- must not fire
// Correct data, and the places the word appears without a charge being filed.
const NOT_FILED = [
  ["the type union that defines the family", `export type ChargeFamily = "tech" | "passthrough";`],
  ["the interface field", `  family: ChargeFamily;`],
  ["a charge in the other family", `family: "tech",`],
  ["a charge in the other family, single-quoted", `family: 'tech',`],
  ["mismatched quotes are not a string literal", `family: "passthrough',`],
  ["a different key ending in the same word", `chargeFamily_note: "passthrough"`],
];

for (const [name, src] of FILED) {
  say(PASSTHROUGH_FILED.test(src), `must fire — ${name}`, src.replace(/\n/g, "\\n"));
}
for (const [name, src] of NOT_FILED) {
  say(!PASSTHROUGH_FILED.test(src), `must not fire — ${name}`, src.replace(/\n/g, "\\n"));
}

// ------------------------------------------------------- the guard fails CLOSED
// "Cannot tell" must never read as "not filed": that is how a rename silently
// un-arms the rule, which is the failure #83 was filed against in the first place.
{
  const gone = passthroughFiling(null);
  say(gone.readable === false, "a missing charge map must be unreadable, not unfiled");

  const renamed = passthroughFiling(`export const chargeLabels = {\n  family: 'passthrough',\n};`);
  say(renamed.readable === false, "a renamed charge map must be unreadable, not unfiled");

  const ok = passthroughFiling(`export const feeLabels = {\n  a: { family: 'passthrough' },\n};`);
  say(ok.readable === true && ok.filed === true, "a readable, filed map must report filed");
}

// ------------------------------------------------------- against the real file
// Today the suspension is armed and the copy is dormant: no charge is filed into
// the pass-through family. When #48 lands and one is, this control flips and the
// gate starts failing — which is the whole design, so change this line then.
{
  const real = passthroughFiling(readFileSync(LABELS, "utf8"));
  say(real.readable === true, `${LABELS} must be readable by the suspension guard`, real.why);
  say(
    real.filed === false,
    `${LABELS} files a charge into "passthrough" — if #48 has landed, retire the §3.4 suspension and this control`,
  );
}

const total = FILED.length + NOT_FILED.length + 5;
console.log(
  `${failures ? "✗" : "✓"} copy-gate suspension: ${total} controls, ${failures} failure${failures === 1 ? "" : "s"}`,
);
process.exit(failures ? 1 : 0);
