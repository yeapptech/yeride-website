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
// newline slips it ("at&nbsp;cost", "no\n surprises"); so does copy that arrives
// from the fee-schedule endpoint at runtime, and so does anything in a file type
// this does not scan. Most of that is now covered by the second layer,
// scripts/check-dist-copy-gate.mjs (#57), which runs this same pattern list over
// the built output. This gate is still the one worth keeping: it fails at the
// point of authorship with a file and a line number, it runs on every PR without
// a build, and it is where the allowlist bookkeeping lives.
//
// Three §5 rules are judgement, not regex, and are NOT checked here — they stay
// human review at copy time. The list lives with the patterns.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { PATTERNS } from "./copy-gate-patterns.mjs";

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

// Homoglyphs, answering #57's "is folding honest?" with no. A Cyrillic "е" in
// "chеapest" defeats every pattern above, and folding confusables back to ASCII
// needs a table whose wrong entries would invent failures in Spanish copy. The
// confusable is itself the defect, so it is caught rather than folded — and it is
// caught HERE, not over dist/, because src/ and public/ are wholly authored in
// this repo. A vendored bundle may legitimately carry other scripts; a YeRide
// page in English or Spanish never does. Accented Latin is untouched: á, é, ñ and
// ü are Latin, and this looks only at the Greek and Cyrillic blocks.
const CONFUSABLE_SCRIPT = /[Ͱ-ϿЀ-ӿ]/;
for (const file of files) {
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      const hit = line.match(CONFUSABLE_SCRIPT);
      if (!hit) return;
      const point = `U+${hit[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
      errors.push(
        `${file}:${i + 1}  "${hit[0]}" (${point}) is a Greek or Cyrillic letter in EN/ES copy — ` +
          `almost certainly a homoglyph that hides a gated word from this gate`,
      );
    });
}

// Copy-map §3.4 suspends the family-2 heading, lead and insurance note "until
// #48 gives them members again, gated by #41 until then". The pragmas above only
// RECORD that suspension; this enforces it. Those strings render the moment any
// charge is filed into the passthrough family — and they are already in the
// shipped JS bundle, dormant rather than absent — so the data and the allowlist
// have to move together.
const LABELS = "src/i18n/feeLabels.ts";
// Scoped to the /fees copy, because that is the only copy §3.4 suspends. The
// legal pages (#44) also name #48 — they STATE that YeRide has no insurance,
// and the gate cannot tell that denial from a claim — but they are not part of
// the pass-through suspension and must not be swept into "retire these". They
// do have to be rewritten when #48 lands, since the statement becomes false;
// that is recorded on #48 itself rather than enforced by this rule, which would
// otherwise demand the legal pages drop a pragma they still need.
const SUSPENSION = /^src[/\\](i18n[/\\]fee(Labels|sCopy)\.ts|components[/\\]FeeSchedule\.astro)$/;
const suspended = pragmas.filter(
  (p) => /#48(?!\w)/.test(p.reason) && SUSPENSION.test(p.file),
);
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
