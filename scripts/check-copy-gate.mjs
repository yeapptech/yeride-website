// Copy-gate lint — gated and never-claimed strings must not reach the site.
// Wayfinder #41; the string list is docs/copy-map.md §5 (on the copy-map/en-es
// branch until it merges).
//
// Dumb on purpose: comments are stripped, everything else under src/ and
// public/ is matched against a fixed pattern list. A string that has to stay in
// the source without running — the suspended pass-through family is the case
// this was built for — is exempted one line at a time with
//
//     // copy-gate-allow: <why, naming the ticket that retires it, e.g. #48>
//
// The pragma must sit in a comment, must name a ticket, and one that stops
// matching anything fails the build, so the allowlist cannot outlive its reason.
//
// WHAT THIS CANNOT DO — read before trusting it (adversarial review, 2026-08-02):
// it is a line matcher over source text, so it holds against careless mistakes
// and not against evasion. A phrase broken across a tag, an HTML entity or a
// newline slips it ("at&nbsp;cost", "no\n surprises", "$" + "9"); so does copy
// that arrives from the fee-schedule endpoint at runtime, and so does anything
// in a file type this does not scan. The gate that would subsume those runs the
// same pattern list over dist/ after the build, with entities and whitespace
// normalised — filed as its own ticket, not done here.
//
// Three §5 rules are judgement, not regex, and are NOT checked here — they stay
// human review at copy time:
//   - copy claiming a visible per-trip fee breakdown in the app
//   - invented per-trip price or earnings comparisons against Uber or Lyft
//   - safety claims beyond Fla. Stat. § 627.748

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// public/ is copied verbatim into dist/, so it ships exactly as written.
const ROOTS = ["src", "public"];
const SCAN_EXT = /\.(astro|ts|tsx|js|jsx|mjs|cjs|md|mdx|html|json|ya?ml|svg|css|txt)$/;

const PRAGMA = /copy-gate-allow:[ \t]*(.+?)[ \t]*$/;
// "#48ff00" is a colour, not a ticket.
const TICKET = /#\d+(?!\w)/;
// A pragma only counts inside a comment — otherwise shipped markup could
// authorise itself, e.g. <p data-note="copy-gate-allow: ... #48">.
const IN_COMMENT = /(\/\/|\/\*|<!--|^[ \t]*\*)/;
const COMMENT_ONLY_LINE = /^[ \t]*(\{?[ \t]*\/\*|\/\/|\*)/;

const PATTERNS = [
  // Gated until positioning obligations 1–3 all ship (driver pillar 2).
  { re: /see the math/i, why: "gated: driver pillar 2, obligations 1–3" },
  { re: /cuentas claras/i, why: "gated: driver pillar 2, obligations 1–3" },

  // Gated until YeRide actually has insurance coverage (#48). There is no
  // pass-through family today: insurance does not exist and card processing is
  // Stripe billing the driver's own connected account, not YeRide forwarding it.
  { re: /\bat[- ]cost\b/i, why: "gated on #48: nothing is passed through at cost" },
  { re: /\bal costo\b/i, why: "gated on #48: nothing is passed through at cost" },
  // The separator is required, as §5 writes it. The one-word "passthrough" is
  // only ever an identifier here (ChargeFamily, the family filter), never a claim.
  { re: /\bpass(es|ed|ing)?[- ]through\b/i, why: "gated on #48: the pass-through family has no members" },
  { re: /\b(zero|without) markup\b/i, why: "gated on #48: the pass-through family has no members" },
  { re: /\bsin (recargo|margen)\b/i, why: "gated on #48: the pass-through family has no members" },
  // The same claim without any of the words above — §3.4's suspended family-2
  // lead reads "Costs YeRide forwards without touching." / "…traslada sin tocar."
  { re: /\bforwards?\b[^.]{0,30}\bwithout touching\b/i, why: "gated on #48: pass-through claim without the words" },
  { re: /\btraslada\b[^.]{0,30}\bsin tocar\b/i, why: "gated on #48: pass-through claim without the words" },
  { re: /\binsurance\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\b(seguros?|aseguranza|p[óo]liza)\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\bcoverage\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\bcobertura\b/i, why: "gated on #48: YeRide carries no coverage" },

  // Never claimed, gate or no gate.
  { re: /\blocked\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bupfront (price|pricing)\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bprecio (fijo|cerrado|garantizado)\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bno surprises\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bsin sorpresas\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bno surge\b(?![ \t]+today)/i, why: 'never claimed: only "no surge today" is permitted (§3.4)' },
  { re: /\bnunca\b[^.]{0,20}\brecargo\b/i, why: 'never claimed: only "no surge today" is permitted (§3.4)' },
  { re: /\bcheape(st|r)\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\blowest (fees|fares|price)\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\bm[áa]s barat[oa]s?\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\bm[áa]s econ[óo]mico\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\$[ \t]?\d/, why: "never claimed: no hard-coded money — every figure is fetched live" },
  { re: /\b\d[\d,.]*[ \t]*(dollars|USD)\b/i, why: "never claimed: no hard-coded money — every figure is fetched live" },
];

// Blank comments out, keeping every newline so line numbers still line up.
//
// Only LINE-LEADING comment openers are stripped. A "//" or "/*" mid-line is far
// more likely to be shipped text or a string literal than a comment — blanking
// those let "Ride now // insurance at cost" through, and let "images/*" pair
// with a later "*/" to swallow the lines between. HTML comments are NOT stripped
// at all: Astro emits <!-- --> into the built HTML, so they do ship.
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return src
    .replace(/^[ \t]*\{?[ \t]*\/\*[\s\S]*?\*\//gm, blank)
    .replace(/^[ \t]*\/\/.*$/gm, blank);
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const errors = [];
const allowed = [];
const pragmas = [];
let scanned = 0;

const files = ROOTS.flatMap(walk).filter((p) => SCAN_EXT.test(p));

for (const file of files) {
  scanned++;
  const source = readFileSync(file, "utf8");
  const raw = source.split(/\r?\n/);
  const code = stripComments(source).split(/\r?\n/);

  raw.forEach((line, i) => {
    const hit = line.match(PRAGMA);
    if (!hit) return;
    const before = line.slice(0, line.indexOf("copy-gate-allow:"));
    if (!IN_COMMENT.test(before)) {
      errors.push(`${file}:${i + 1}  copy-gate-allow only counts inside a comment`);
      return;
    }
    pragmas.push({
      file,
      line: i + 1,
      reason: hit[1],
      // Only a comment-only line may cover the line below it; an inline pragma
      // covers its own line and nothing else.
      coversNext: COMMENT_ONLY_LINE.test(line),
      used: false,
    });
  });

  code.forEach((line, i) => {
    for (const { re, why } of PATTERNS) {
      const hit = line.match(re);
      if (!hit) continue;

      const here = i + 1;
      const pragma =
        pragmas.find((p) => p.file === file && p.line === here) ??
        pragmas.find((p) => p.file === file && p.line === here - 1 && p.coversNext);
      const where = `${file}:${here}`;

      if (!pragma) {
        errors.push(`${where}  "${hit[0]}" — ${why}`);
      } else if (!TICKET.test(pragma.reason)) {
        errors.push(`${where}  copy-gate-allow must name the ticket that retires it, e.g. "#48"`);
        pragma.used = true;
      } else {
        pragma.used = true;
        allowed.push(`${where}  "${hit[0]}" — ${pragma.reason}`);
      }
    }
  });
}

for (const p of pragmas.filter((p) => !p.used)) {
  errors.push(`${p.file}:${p.line}  copy-gate-allow matches nothing any more — delete it`);
}

// Copy-map §3.4 suspends the family-2 heading, lead and insurance note "until
// #48 gives them members again, gated by #41 until then". The pragmas above only
// RECORD that suspension; this enforces it. Those strings render the moment any
// charge is filed into the passthrough family — and they are already in the
// shipped JS bundle, dormant rather than absent — so the data and the allowlist
// have to move together.
const LABELS = "src/i18n/feeLabels.ts";
const suspended = pragmas.filter((p) => /#48(?!\w)/.test(p.reason));
if (suspended.length && /family:\s*"passthrough"/.test(stripComments(readFileSync(LABELS, "utf8")))) {
  errors.push(
    `${LABELS}  a charge is now filed into the "passthrough" family, so the family-2 copy ` +
      `renders on /fees — #48 has landed, so retire its ${suspended.length} copy-gate-allow ` +
      `pragma(s) and the §3.4 suspension with it`,
  );
}

if (errors.length) {
  console.error(`✗ copy gate (${scanned} files)`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  The list is docs/copy-map.md §5, on the copy-map/en-es branch until it merges:`);
  console.error(`    git show origin/copy-map/en-es:docs/copy-map.md`);
  console.error(`  To keep a string that does not run, put "// copy-gate-allow: <why> (#ticket)"`);
  console.error(`  on it, or on a comment-only line directly above it.`);
  process.exit(1);
}

console.log(`✓ copy gate (${scanned} files)`);
for (const a of allowed) console.log(`  allowed: ${a}`);
