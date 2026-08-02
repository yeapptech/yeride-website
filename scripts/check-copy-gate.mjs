// Copy-gate lint — gated and never-claimed strings must not reach the site.
// Wayfinder #41; the string list is docs/copy-map.md §5.
//
// Dumb on purpose: comments are stripped (they never ship), everything else
// under src/ is matched against a fixed pattern list. A string that has to stay
// in the source without running — the suspended pass-through family is the case
// this was built for — is exempted one line at a time with
//
//     // copy-gate-allow: <why, naming the ticket that retires it, e.g. #48>
//
// on the matching line or the line above it. The pragma must name a ticket, and
// a pragma that stops matching anything fails the build, so the allowlist
// cannot quietly outlive its reason.
//
// Three §5 rules are judgement, not regex, and are NOT checked here — they stay
// human review at copy time:
//   - copy claiming a visible per-trip fee breakdown in the app
//   - invented per-trip price or earnings comparisons against Uber or Lyft
//   - safety claims beyond Fla. Stat. § 627.748

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const SCAN_EXT = /\.(astro|ts|tsx|js|mjs|md|mdx|html)$/;
const PRAGMA = /copy-gate-allow:\s*(.+)$/;

const PATTERNS = [
  // Gated until positioning obligations 1–3 all ship (driver pillar 2).
  { re: /see the math/i, why: "gated: driver pillar 2, obligations 1–3" },
  { re: /cuentas claras/i, why: "gated: driver pillar 2, obligations 1–3" },

  // Gated until YeRide actually has insurance coverage (#48). There is no
  // pass-through family today: insurance does not exist and card processing is
  // Stripe billing the driver's own connected account, not YeRide forwarding it.
  { re: /\bat cost\b/i, why: "gated on #48: nothing is passed through at cost" },
  { re: /\bal costo\b/i, why: "gated on #48: nothing is passed through at cost" },
  { re: /\bpass(es|ed|ing)?[- ]through\b/i, why: "gated on #48: the pass-through family has no members" },
  { re: /\bzero markup\b/i, why: "gated on #48: the pass-through family has no members" },
  { re: /\bsin recargo\b/i, why: "gated on #48: the pass-through family has no members" },
  { re: /\binsurance\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\bseguros?\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\bcoverage\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\bcobertura\b/i, why: "gated on #48: YeRide carries no coverage" },

  // Never claimed, gate or no gate.
  { re: /\blocked\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bupfront price\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bno surprises\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bno surge ever\b/i, why: 'never claimed: only "no surge today" is permitted (§3.4)' },
  { re: /nunca habrá recargo/i, why: 'never claimed: only "no surge today" is permitted (§3.4)' },
  { re: /\bcheapest\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\blowest fees\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\bmás barat[oa]s?\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\$\s?\d/, why: "never claimed: no hard-coded money — every figure is fetched live" },
];

/** Blank comments out, keeping every newline so line numbers still line up. */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return src
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    // Not preceded by ":" so "https://" survives.
    .replace(/(^|[^:\w])\/\/.*$/gm, (m, before) => before + " ".repeat(m.length - before.length));
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const errors = [];
const allowed = [];
const pragmasSeen = [];
let scanned = 0;

for (const file of walk(ROOT).filter((p) => SCAN_EXT.test(p))) {
  scanned++;
  const raw = readFileSync(file, "utf8").split("\n");
  const code = stripComments(readFileSync(file, "utf8")).split("\n");

  raw.forEach((line, i) => {
    const pragma = line.match(PRAGMA);
    if (pragma) pragmasSeen.push({ file, line: i + 1, reason: pragma[1].trim(), used: false });
  });

  code.forEach((line, i) => {
    for (const { re, why } of PATTERNS) {
      const hit = line.match(re);
      if (!hit) continue;

      const pragma = pragmasSeen.find(
        (p) => p.file === file && (p.line === i + 1 || p.line === i),
      );
      const where = `${file}:${i + 1}`;

      if (!pragma) {
        errors.push(`${where}  "${hit[0]}" — ${why}`);
      } else if (!/#\d+/.test(pragma.reason)) {
        errors.push(`${where}  copy-gate-allow must name the ticket that retires it, e.g. "#48"`);
        pragma.used = true;
      } else {
        pragma.used = true;
        allowed.push(`${where}  "${hit[0]}" — ${pragma.reason}`);
      }
    }
  });
}

for (const p of pragmasSeen.filter((p) => !p.used)) {
  errors.push(`${p.file}:${p.line}  copy-gate-allow matches nothing any more — delete it`);
}

if (errors.length) {
  console.error(`✗ copy gate (${scanned} files)`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  The list is docs/copy-map.md §5. To keep a string that does not run,`);
  console.error(`  put "// copy-gate-allow: <why> (#ticket)" on it or the line above.`);
  process.exit(1);
}

console.log(`✓ copy gate (${scanned} files)`);
for (const a of allowed) console.log(`  allowed: ${a}`);
