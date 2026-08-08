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
// TWO LAYERS, and the second is the one the ticket actually asked for.
//
// 1. The reader alone: every string literal syntax, in the quote styles this
//    repo does NOT use, plus the places `passthrough` appears without a charge
//    being filed. A guard widened until it fires on the type union that merely
//    NAMES the family would fail the build on correct data and get deleted.
// 2. check-copy-gate.mjs ITSELF, spawned over a temporary fixture tree. This is
//    the layer that closes #83's objection. The reader being right is not the
//    claim; the claim is that the GATE fails, and between the two sit the arming
//    condition (a #48 pragma in a suspension-scoped file), the comment-stripping
//    pass, and the import wiring — none of which a unit control touches. The
//    first review of this file found exactly that gap: delete the rule's
//    `errors.push` and every reader-level control still passed.
//
// The fixture is a temp directory, never the real tree. An earlier draft asserted
// against the real src/i18n/feeLabels.ts read RAW, where the gate reads it
// comment-stripped — so an ordinary explanatory comment mentioning the family
// failed the build on data the gate correctly ignores, the exact over-reach the
// second list exists to prevent. Mutating a tracked file would also leave the
// repo dirty if this process were killed mid-run, and it now runs on every PR.
// That the real file is armed and dormant today is asserted by the gate's own
// green run over the real tree, one step later in `npm run checks`.
//
// Like scripts/copy-gate-patterns.test.mjs, this lives in scripts/, which
// neither gate scans, so the forbidden phrases below are safe to write down.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { passthroughFiling, PASSTHROUGH_FILED } from "./copy-gate-suspension.mjs";

const GATE = fileURLToPath(new URL("./check-copy-gate.mjs", import.meta.url));
let failures = 0;

const say = (ok, label, detail) => {
  if (ok) return;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
  failures++;
};

// ------------------------------------------------------- 1. the reader alone
// must fire — a charge filed into the pass-through family, however it is written
const FILED = [
  ["double quotes — the one style the rule used to read", `family: "passthrough",`],
  ["single quotes — #83's bypass", `family: 'passthrough',`],
  ["backticks", "family: `passthrough`,"],
  ["no space after the colon", `family:'passthrough',`],
  ["space before the colon", `family : 'passthrough',`],
  ["broken across lines", `family:\n    'passthrough',`],
  ["inside a realistic entry", `tripInsuranceFl: {\n  en: "Trip protection",\n  es: "Protección del viaje",\n  family: 'passthrough',\n  payer: "rider",\n},`],
];

// must not fire — correct data, and the places the word appears unfiled
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

// The reader fails CLOSED: "cannot tell" must never read as "not filed", which
// is how a rename silently un-arms the rule — the failure #83 was filed against.
say(passthroughFiling(null).readable === false, "a missing charge map must be unreadable, not unfiled");
say(
  passthroughFiling(`export const chargeLabels = {\n  family: 'passthrough',\n};`).readable === false,
  "a renamed charge map must be unreadable, not unfiled",
);
{
  const ok = passthroughFiling(`export const feeLabels = {\n  a: { family: 'passthrough' },\n};`);
  say(ok.readable === true && ok.filed === true, "a readable, filed map must report filed");
}

// --------------------------------------------------- 2. the gate, end to end
// The gate walks ROOTS = ["src", "public"] relative to its working directory and
// reads LABELS = "src/i18n/feeLabels.ts", so a temp tree with those two
// directories is a complete world to it.
//
// ARMED means a copy-gate-allow pragma naming #48 sits in a suspension-scoped
// file. It goes in feesCopy.ts rather than feeLabels.ts, which is both where the
// real ones live and what makes the missing-file case reachable at all: a pragma
// inside feeLabels.ts is deleted along with it, so the guard would find nothing
// suspended and correctly stay silent. The pragma must also still MATCH
// something, or the gate fails for a different reason ("matches nothing any
// more"), so it sits on a real gated phrase — "at cost", one of the §3.4 strings
// this whole rule exists to keep off /fees.
const ARMED_COPY = `export const feesCopy = {
  // copy-gate-allow: pass-through family suspended — no charge is filed into it (#48)
  familyTwoLead: "at cost",
};
`;
const LABELS = (family) => `export const feeLabels = {
  bookingCharge: { en: "Booking charge", family: ${family} },
};
`;

function runGate({ labels, copy = ARMED_COPY }) {
  const dir = mkdtempSync(join(tmpdir(), "copy-gate-suspension-"));
  try {
    mkdirSync(join(dir, "src", "i18n"), { recursive: true });
    mkdirSync(join(dir, "public"), { recursive: true });
    if (copy !== null) writeFileSync(join(dir, "src", "i18n", "feesCopy.ts"), copy);
    if (labels !== null) writeFileSync(join(dir, "src", "i18n", "feeLabels.ts"), labels);
    const r = spawnSync(process.execPath, [GATE], { cwd: dir, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const FILED_MSG = 'filed into the "passthrough" family';
const UNREADABLE_MSG = "the §3.4 suspension guard cannot read this file";

// The baseline: armed, nothing filed. If this is not green the fixture is wrong
// and every mutation below proves nothing.
{
  const { code, out } = runGate({ labels: LABELS('"tech"') });
  say(code === 0, "fixture baseline — armed and dormant must pass the gate", out.trim());
}

// THE POSITIVE CONTROL #83 ASKED FOR: the gate must fail, in every quote style.
for (const [name, family] of [
  ["single quotes — #83's bypass", `'passthrough'`],
  ["double quotes", `"passthrough"`],
  ["backticks", "`passthrough`"],
]) {
  const { code, out } = runGate({ labels: LABELS(family) });
  say(code === 1 && out.includes(FILED_MSG), `the GATE must fail — ${name}`, out.trim());
}

// Comments are prose. The gate strips them before reading, so an explanatory
// mention of the family while #48 is pending must NOT fail the build.
{
  const { code, out } = runGate({
    labels: `${LABELS('"tech"')}// when #48 lands this becomes family: 'passthrough',\n`,
  });
  say(code === 0, "a comment mentioning the family must not fail the gate", out.trim());
}

// Fail closed, through the gate rather than the reader.
{
  const { code, out } = runGate({ labels: LABELS('"tech"').replace("feeLabels", "chargeLabels") });
  say(code === 1 && out.includes(UNREADABLE_MSG), "the GATE must fail on a renamed charge map", out.trim());
}
{
  const { code, out } = runGate({ labels: null });
  say(code === 1 && out.includes(UNREADABLE_MSG), "the GATE must fail on a missing charge map", out.trim());
}

// The arming condition itself. With no #48 pragma the suspension is over, so a
// charge filed into the family is ordinary data and the rule must stay silent —
// otherwise retiring the suspension could never be done without tripping it.
{
  const { code, out } = runGate({ labels: LABELS(`'passthrough'`), copy: null });
  say(
    code === 0,
    "with no #48 pragma outstanding the rule must stay silent — the suspension is over",
    out.trim(),
  );
}

const total = FILED.length + NOT_FILED.length + 3 + 8;
console.log(
  `${failures ? "✗" : "✓"} copy-gate suspension: ${total} controls, ${failures} failure${failures === 1 ? "" : "s"}`,
);
process.exit(failures ? 1 : 0);
