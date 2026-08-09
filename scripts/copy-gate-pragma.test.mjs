// Controls for the copy-gate-allow pragma rule. Plain node, no runner, no deps:
//
//     node scripts/copy-gate-pragma.test.mjs
//
// Wayfinder #100 added this file. The rule it covers said, in its own source
// comment, that it existed to stop shipped markup authorising itself — and it
// did not: it asked whether "//", "/*", "<!--" or a leading "*" appeared
// ANYWHERE before the pragma on the line, and a URL contains "//". So
//
//     <p data-src="https://x.test/a">Rides at cost. copy-gate-allow: ok #99</p>
//
// passed the gate and printed itself as an allowance. Executed, not read.
//
// TWO LAYERS, and the second is the one that matters — the same shape and the
// same reason as scripts/copy-gate-suspension.test.mjs, whose first review found
// that deleting the rule's `errors.push` left every reader-level control green.
//
// 1. The reader alone: readPragma over the shapes that must be accepted, the
//    shapes that must be refused, and the lines that are not pragmas at all.
//    The second list is the valuable half, exactly as it is for the pattern and
//    normalise controls: this rule is easy to tighten too far, and over-reach
//    here rejects a correct pragma and fails the build on copy nobody may edit.
//    Every accepted shape below is a shape that exists, or could plausibly be
//    written, in this repo.
// 2. check-copy-gate.mjs ITSELF, spawned over a temporary fixture tree. Between
//    the reader and the claim sit the import wiring, the misplaced-pragma error
//    path, the pragma/hit line pairing and the "matches nothing any more" sweep.
//    A reader that returns the right answer into a caller that ignores it is the
//    failure this layer exists to catch. It runs #100's own exploit line and
//    requires a non-zero exit.
//
// The fixture is a temp directory, never the real tree — mutating a tracked file
// would leave the repo dirty if this process were killed, and it now runs on
// every PR. That the twelve real pragmas still pass is asserted by the gate's
// own green run over the real tree, one step later in `npm run checks`.
//
// Like the other two control sets, this lives in scripts/, which neither gate
// scans, so the forbidden phrases below are safe to write down.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readPragma } from "./copy-gate-pragma.mjs";

const GATE = fileURLToPath(new URL("./check-copy-gate.mjs", import.meta.url));
let failures = 0;

const say = (ok, label, detail) => {
  if (ok) return;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
  failures++;
};

// ------------------------------------------------------- 1. the reader alone
// must be ACCEPTED — the pragma opens its comment. Rejecting any of these fails
// the build on a correctly written allowance, which is the over-reach that gets
// a gate deleted rather than fixed.
const ACCEPTED = [
  ["the shape all twelve live pragmas use", `// copy-gate-allow: suspended until #48`],
  ["indented, as it is inside feesCopy.ts", `    // copy-gate-allow: suspended until #48`],
  ["a tab indent", `\t// copy-gate-allow: suspended until #48`],
  ["no space after the opener", `//copy-gate-allow: suspended until #48`],
  ["a triple slash", `/// copy-gate-allow: suspended until #48`],
  ["a block comment", `/* copy-gate-allow: suspended until #48 */`],
  ["a JSDoc opener", `/** copy-gate-allow: suspended until #48 */`],
  ["a JSDoc continuation line", ` * copy-gate-allow: suspended until #48`],
  ["an HTML comment — the only syntax .astro markup has", `<!-- copy-gate-allow: suspended until #48 -->`],
  ["the .astro expression-wrapped block comment", `{/* copy-gate-allow: suspended until #48 */}`],
  ["that form with space after the brace", `{ /* copy-gate-allow: suspended until #48 */}`],
];

// must be REFUSED — the pragma does not open its comment, so something other
// than a comment introduced it. Every one of these was accepted before #100.
const REFUSED = [
  ["#100's exploit: a URL in an attribute", `<p data-src="https://x.test/a">Rides at cost. copy-gate-allow: ok #99</p>`],
  ["a bare URL anywhere earlier on the line", `const help = "https://yeride.com"; copy-gate-allow: ok #99`],
  ["the self-authorising data attribute the old comment named", `<p data-note="copy-gate-allow: ok #48">Rides at cost</p>`],
  ["a trailing inline comment — no longer a pragma site", `familyTwoLead: "at cost", // copy-gate-allow: ok #48`],
  ["a glob that pairs into a comment opener", `const assets = "images/*"; copy-gate-allow: ok #99`],
  ["prose in a comment that merely mentions the pragma", `// write it as copy-gate-allow: <why> (#ticket)`],
  ["a shipped sentence with no comment at all", `<p>Rides at cost. copy-gate-allow: ok #99</p>`],
  ["a JSON string value, the public/ case that has no comment syntax", `  "note": "copy-gate-allow: ok #99",`],
];

// NOT A PRAGMA at all — readPragma must return null, so the gate stays quiet
// rather than reporting a misplaced pragma on an ordinary line.
const ABSENT = [
  ["an ordinary line of copy", `familyTwoLead: "Charges we pass through",`],
  ["the phrase without its colon, as legalCopy.ts's header writes it", "// lines carry an explicit `copy-gate-allow` naming #48"],
  ["a similar-looking word", `// copy-gate-allowance: not the pragma`],
  ["an empty line", ``],
];

for (const [name, line] of ACCEPTED) {
  const r = readPragma(line);
  say(r !== null && !r.misplaced, `must be accepted — ${name}`, line);
}
for (const [name, line] of REFUSED) {
  const r = readPragma(line);
  say(r !== null && r.misplaced === true, `must be refused as misplaced — ${name}`, line);
}
for (const [name, line] of ABSENT) {
  say(readPragma(line) === null, `must not be read as a pragma at all — ${name}`, line);
}

// The reason is captured whole, to end of line. The caller strips the closing
// delimiter; that split is asserted end to end below, where the gate prints it.
{
  const r = readPragma(`// copy-gate-allow: suspended until #48`);
  say(r.reason === "suspended until #48", "the reason is captured to end of line", r.reason);
}

// --------------------------------------------------- 2. the gate, end to end
// The gate walks ROOTS = ["src", "public"] relative to its working directory, so
// a temp tree with those two directories is a complete world to it.
//
// "at cost" is one of the copy-map §5 strings the pragma exists to bless, and
// the phrase §3.4 suspends; it is what the twelve live pragmas sit on.
function runGate(files) {
  const dir = mkdtempSync(join(tmpdir(), "copy-gate-pragma-"));
  try {
    mkdirSync(join(dir, "src", "i18n"), { recursive: true });
    mkdirSync(join(dir, "public"), { recursive: true });
    for (const [name, body] of Object.entries(files)) {
      writeFileSync(join(dir, "src", name), body);
    }
    const r = spawnSync(process.execPath, [GATE], { cwd: dir, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const MISPLACED_MSG = "copy-gate-allow must OPEN its own comment";

// The baseline: a real pragma, written the way the repo writes them, blessing a
// real gated phrase. If this is not green the fixture is wrong and every
// mutation below proves nothing.
{
  const { code, out } = runGate({
    "i18n/copy.ts": `export const copy = {\n  // copy-gate-allow: suspended, nothing is filed into the family (#48)\n  lead: "at cost",\n};\n`,
  });
  say(code === 0, "fixture baseline — a correctly opened pragma must pass the gate", out.trim());
  say(out.includes("suspended, nothing is filed into the family (#48)"), "the gate prints the reason", out.trim());
}

// THE POSITIVE CONTROL #100 ASKED FOR. Byte for byte the line the review
// executed. The GATE must fail — not the reader.
{
  const { code, out } = runGate({
    "Bad.astro": `<p data-src="https://x.test/a">Rides at cost. copy-gate-allow: brand approved #99</p>\n`,
  });
  say(code === 1, "the GATE must fail on #100's exploit line", out.trim());
  say(out.includes(MISPLACED_MSG), "and must name the misplaced pragma as the cause", out.trim());
  say(out.includes(`"at cost"`), "and must still report the gated phrase it refused to bless", out.trim());
}

// A misplaced pragma is an ERROR, never a silent no-op. The author who wrote it
// believes they are covered; failing quietly and letting the copy through on
// some other path is the outcome this rule cannot have.
{
  const { code, out } = runGate({
    "i18n/copy.ts": `// see https://yeride.com/docs — copy-gate-allow: ok #99\nexport const lead = "safe";\n`,
  });
  say(code === 1 && out.includes(MISPLACED_MSG), "a misplaced pragma is an error even with no gated copy near it", out.trim());
}

// The pragma covers the line below it. Every pragma now opens its own comment,
// so the old coversNext distinction is gone — this pins the surviving behaviour.
{
  const { code } = runGate({
    "i18n/copy.ts": `export const copy = {\n  /* copy-gate-allow: suspended (#48) */\n  lead: "at cost",\n};\n`,
  });
  say(code === 0, "a block-comment pragma covers the line below it", String(code));
}

// An HTML pragma in .astro markup — the syntax the normalised pass reports in —
// must work, and its reason must not print its own "-->".
{
  const { code, out } = runGate({
    "Fees.astro": `<!-- copy-gate-allow: suspended (#48) -->\n<p>at cost</p>\n`,
  });
  say(code === 0, "an HTML-comment pragma must work in .astro markup", out.trim());
  say(!out.includes("-->"), "and its reason must not carry the closing delimiter", out.trim());
}

// A pragma that no longer matches anything still fails, so the allowlist cannot
// outlive its reason. #100 must not have quietly disarmed that sweep.
{
  const { code, out } = runGate({
    "i18n/copy.ts": `// copy-gate-allow: suspended (#48)\nexport const lead = "nothing gated here";\n`,
  });
  say(code === 1 && out.includes("matches nothing any more"), "an unused pragma must still fail", out.trim());
}

// A pragma without a ticket still fails.
{
  const { code, out } = runGate({
    "i18n/copy.ts": `export const copy = {\n  // copy-gate-allow: brand approved\n  lead: "at cost",\n};\n`,
  });
  say(code === 1 && out.includes("must name the ticket"), "a ticketless pragma must still fail", out.trim());
}

const total = ACCEPTED.length + REFUSED.length + ABSENT.length + 1 + 11;
console.log(
  `${failures ? "✗" : "✓"} copy-gate pragma: ${total} controls, ${failures} failure${failures === 1 ? "" : "s"}`,
);
process.exit(failures ? 1 : 0);
