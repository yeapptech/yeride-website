// Copy gate, second layer — the same §5 pattern list, run over dist/ after the
// build. Wayfinder #57.
//
// WHY A SECOND GATE. check-copy-gate.mjs matches lines of source text, so it is
// blind to everything the build does to that text: a phrase broken across a tag,
// an HTML entity or a newline slips it, and ordinary Prettier wrapping produces
// that by accident. This one measures the promise itself — a forbidden claim must
// not reach the shipped site — by reading what is actually shipped.
//
// It does not replace the first gate. The source gate fails at the point of
// authorship with a file and a line number, runs on every PR without a build or
// a private registry, and owns the per-line allowlist. Keep both.
//
// ---------------------------------------------------------------------------
// WHAT COUNTS AS "SHIPPED": the bytes, not the pixels.
//
// Everything under dist/ is publicly fetchable, so everything under dist/ is
// scanned — including comments, which are not rendered but are served. That is
// the same call the source gate makes about HTML comments, for the same reason.
//
// Scanning the built HTML alone would have caught almost nothing that matters:
// /fees renders its charge rows client-side, so its copy exists only in
// dist/_astro/FeeSchedule.*.js and never appears in dist/fees/index.html.
//
// ---------------------------------------------------------------------------
// NORMALISATION — how much is honest (#57's third sub-question).
//
// Applied, because each is exactly what a browser does, and skipping it would
// let an accident through:
//   - character references, decoded in ONE left-to-right pass. One pass is the
//     point: "&amp;#36;" renders as the literal text "&#36;", not "$", and a
//     second pass would invent a hit the reader never sees.
//   - invisible characters (zero-width space/joiner, soft hyphen, BOM) removed —
//     they exist only to split a word without showing it.
//   - JS \uXXXX / \xXX / \u{...} escapes decoded in script and style bundles.
//   - whitespace collapsed to single spaces, so a newline inside a phrase — the
//     accidental case — reads as the space it renders as.
//
// Markup is handled by scanning THREE views of each HTML file, because no single
// one of them is honest on its own:
//   - tags left alone: the plain reading.
//   - tags removed to nothing: catches "Insur<span>ance</span>". It cannot
//     fabricate a multi-word phrase, because removing a tag removes the gap
//     rather than creating one — "<li>zero</li><li>markup</li>" becomes
//     "zeromarkup", which matches nothing.
//   - tags replaced by a space: catches a phrase split across two elements.
//     This is the one that CAN fabricate — "<td>no</td><td>surprises</td>" reads
//     as two cells and matches "no surprises" — so the hit names the view that
//     produced it, and a fabricated one is blessed once in ALLOWED below.
// A hit is counted once per matched string, at the highest count any view saw,
// so the three views cannot inflate each other.
//
// NOT applied: homoglyph folding. Folding needs a confusables table, and a wrong
// entry in it invents failures in Spanish copy, which is full of legitimate
// non-ASCII. The Cyrillic "е" in "chеapest" is instead caught where it is
// introduced — check-copy-gate.mjs fails on a Cyrillic or Greek letter in source,
// which is unambiguous there because no vendored code is in scope.
//
// ---------------------------------------------------------------------------
// WHAT IT STILL CANNOT DO:
//   - copy assembled at runtime from fragments — ["lowest","fees"].join(" ") —
//     is invisible to any static check. Server-side assembly IS caught, because
//     the result is in the built HTML; client-side assembly is not.
//   - copy that arrives from getFeeSchedule at runtime is in neither the source
//     nor the build. That residual belongs to #56, which asks the live endpoint
//     what it publishes and fails the deploy on a charge id this site cannot name
//     — an unnamed id being exactly the case where FeeSchedule.astro falls back
//     to printing the backend's own description verbatim.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { PATTERNS } from "./copy-gate-patterns.mjs";

const ROOT = "dist";
const SCAN_EXT = /\.(html|js|mjs|json|svg|css|txt|xml|webmanifest)$/;
const MARKUP_EXT = /\.(html|svg|xml)$/;
const SCRIPT_EXT = /\.(js|mjs|json|css)$/;

// Rollup/Vite stamp a content hash into every emitted asset, so the filename
// changes whenever the file does. The allowlist below is keyed to the name with
// that segment removed, which is the part that is stable across builds.
const CONTENT_HASH = /\.[A-Za-z0-9_-]{8,}(?=\.[A-Za-z0-9]+$)/;

// ---------------------------------------------------------------------------
// The allowlist (#57's first sub-question: the source pragmas are stripped from
// the build, so they cannot be seen from here and this needs its own).
//
// Every entry is a string a human has looked at and blessed. Keyed by the
// hash-free path, the matched text, and how many times it may appear — an entry
// that stops matching, or matches a different number of times, FAILS, exactly as
// a stale copy-gate-allow pragma does. That is what stops this list going quiet:
// re-blessing is a decision, and adding one more "insurance" to a legal page
// should cost one.
//
// `why` must name an issue — the same discipline as the source pragma — or say
// `vendored:` and name the package, for a file this repo does not author and
// cannot edit. There is no third kind of reason.
const ALLOWED = [
  // §3.4's pass-through family is suspended: no charge is filed into the family,
  // so none of this renders. It is bundled rather than absent, which is a
  // deliberate trade — deleting the strings would also delete the source pragmas,
  // and with them the check in check-copy-gate.mjs that fails the build the
  // moment a charge IS filed into "passthrough". A silent empty panel is worse
  // than dormant copy. These retire together, with #48.
  ...[
    "at cost",
    "al costo",
    "passed through",
    "zero markup",
    "sin recargo",
    "forwards without touching",
    "traslada sin tocar",
    "insurance",
    "coverage",
    "cobertura",
  ].map((text) => ({
    file: "_astro/FeeSchedule.astro_astro_type_script_index_0_lang.js",
    text,
    count: 1,
    why: "§3.4 pass-through family suspended — bundled but unreachable, no charge carries the family (#48)",
  })),

  // The legal pages (#44) DENY that YeRide has insurance. §5 cannot tell a denial
  // from a claim, and the denial is the honest thing to publish, so it ships.
  // When #48 lands these sentences become false and must be rewritten — which is
  // why the entries name it rather than being deleted.
  { file: "privacy-policy/index.html", text: "insurance", count: 1, why: "factual: a field the app collects (the vehicle's policy number), not a claim YeRide carries any — rewrite when #48 lands" },
  { file: "es/privacy-policy/index.html", text: "póliza", count: 1, why: "factual: a field the app collects, not a claim YeRide carries any — rewrite when #48 lands" },
  { file: "es/privacy-policy/index.html", text: "seguro", count: 1, why: "part of \"póliza de seguro\" — the same collected field — rewrite when #48 lands" },
  { file: "terms/index.html", text: "insurance", count: 1, why: "the denial the gate exists to protect — YeRide has none and says so; rewrite when #48 lands" },
  { file: "es/terms/index.html", text: "seguro", count: 1, why: "the denial the gate exists to protect — YeRide has none and says so; rewrite when #48 lands" },

  // An XML comment inside the brand lockup, describing why the typeface is fixed:
  // "Typeface locked by the brand-typography decision (issue #8)". Not copy, not
  // rendered, and not editable here — brand assets change in the brand repo.
  { file: "_astro/yeride-lockup.svg", text: "locked", count: 1, why: "vendored: @yeapptech/yeride-brand — an XML comment in the lockup asset, not copy" },
];

const ISSUE_OR_VENDOR = /#\d+(?!\w)|^vendored:/;

// ---------------------------------------------------------------------------

const REFERENCE = /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi;
// The named references Astro emits, plus the ones that would be used to split or
// disguise a word. A reference outside this table is left as written, which is
// the safe direction: it can hide a claim from this gate, but it cannot invent
// one — and anything authored in this repo is seen by the source gate first.
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  nbsp: " ", ensp: " ", emsp: " ", thinsp: " ", hairsp: " ",
  shy: "", zwnj: "", zwj: "", lrm: "", rlm: "",
  mdash: "—", ndash: "–", hellip: "…", middot: "·",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  dollar: "$", cent: "¢", pound: "£", euro: "€", yen: "¥",
  copy: "©", reg: "®", trade: "™", deg: "°", sect: "§", para: "¶",
};

// Written as escapes, not as the characters themselves: these are invisible, so
// a literal class here is unreviewable and one lost byte in an editor would
// silently narrow the gate. Soft hyphen, the zero-width/bidi block, word joiner,
// BOM.
const INVISIBLE = /[­​-‏⁠﻿]/g;

const cp = (n) => (n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "");

/** One left-to-right pass, exactly as a browser resolves references. */
function decodeReferences(s) {
  return s.replace(REFERENCE, (whole, body) => {
    if (body[0] === "#") {
      const n = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isNaN(n) ? whole : cp(n);
    }
    const named = NAMED[body.toLowerCase()];
    return named === undefined ? whole : named;
  });
}

function decodeScriptEscapes(s) {
  return s
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (_, h) => cp(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => cp(parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => cp(parseInt(h, 16)));
}

const collapse = (s) => s.replace(INVISIBLE, "").replace(/\s+/g, " ");

/** The views of one file that get matched. See the header. */
function viewsOf(file, raw) {
  if (MARKUP_EXT.test(file)) {
    const decoded = decodeReferences(raw);
    return [
      { name: "as-shipped", text: collapse(decoded) },
      { name: "tags-removed", text: collapse(decoded.replace(/<[^>]*>/g, "")) },
      { name: "tags-as-space", text: collapse(decoded.replace(/<[^>]*>/g, " ")) },
    ];
  }
  if (SCRIPT_EXT.test(file)) {
    return [{ name: "as-shipped", text: collapse(decodeScriptEscapes(raw)) }];
  }
  return [{ name: "as-shipped", text: collapse(raw) }];
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const keyOf = (path) =>
  path.replace(/^dist[/\\]/, "").replace(/\\/g, "/").replace(CONTENT_HASH, "");

// Extensions that cannot carry readable copy. Everything else that is not
// scanned gets named in the output: a file type this gate silently ignored would
// otherwise read as a file type it cleared.
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|pdf|mp4|webm)$/i;

let everything;
let files;
try {
  everything = walk(ROOT);
  files = everything.filter((p) => SCAN_EXT.test(p));
} catch {
  console.error(`✗ dist copy gate — no ${ROOT}/ to scan`);
  console.error(`  This runs after "astro build". Run "npm run build", not this script alone.`);
  process.exit(1);
}

const errors = [];
const allowed = [];
const unused = new Set(ALLOWED.keys());
const unread = new Set(
  everything
    .filter((p) => !SCAN_EXT.test(p) && !BINARY.test(p))
    .map((p) => (/\.[A-Za-z0-9]+$/.exec(p) ?? ["(no extension)"])[0]),
);
let scanned = 0;

for (const path of files) {
  scanned++;
  const key = keyOf(path);
  const views = viewsOf(path, readFileSync(path, "utf8"));

  // patternIndex + matched text -> { count, view, why }. The count is the
  // highest any single view saw, never the sum, so three views of one string
  // stay one hit.
  const hits = new Map();
  for (const view of views) {
    for (const [index, { re, why }] of PATTERNS.entries()) {
      const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
      const seen = new Map();
      for (const m of view.text.matchAll(global)) {
        const text = m[0].toLowerCase();
        seen.set(text, (seen.get(text) ?? 0) + 1);
      }
      for (const [text, count] of seen) {
        const id = `${index} ${text}`;
        const prior = hits.get(id);
        if (!prior || count > prior.count) hits.set(id, { text, count, view: view.name, why });
      }
    }
  }

  for (const { text, count, view, why } of hits.values()) {
    const at = ALLOWED.findIndex((a) => a.file === key && a.text.toLowerCase() === text);
    const where = `${key}  "${text}" ×${count} [${view}]`;

    if (at === -1) {
      errors.push(`${where} — ${why}`);
      continue;
    }
    unused.delete(at);
    const entry = ALLOWED[at];
    if (entry.count !== count) {
      errors.push(
        `${where} — allowed ×${entry.count}, found ×${count}. A changed count is a changed claim: ` +
          `re-read it, then update the entry in scripts/check-dist-copy-gate.mjs`,
      );
    } else if (!ISSUE_OR_VENDOR.test(entry.why)) {
      errors.push(`${where} — the allowlist reason must name an issue, or start with "vendored:"`);
    } else {
      allowed.push(`${where} — ${entry.why}`);
    }
  }
}

for (const index of unused) {
  const { file, text, count } = ALLOWED[index];
  errors.push(
    `${file}  "${text}" ×${count} is allowed but no longer appears — delete the entry ` +
      `from scripts/check-dist-copy-gate.mjs`,
  );
}

if (errors.length) {
  console.error(`✗ dist copy gate (${scanned} files)`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  The list is docs/copy-map.md §5, on the copy-map/en-es branch until it merges:`);
  console.error(`    git show origin/copy-map/en-es:docs/copy-map.md`);
  console.error(`  A source pragma cannot reach here — it is stripped by the build. A string that`);
  console.error(`  has to ship without being a claim is blessed in this script's ALLOWED list,`);
  console.error(`  keyed to the path above, with a reason naming the issue that retires it.`);
  process.exit(1);
}

console.log(`✓ dist copy gate (${scanned} files)`);
for (const a of allowed) console.log(`  allowed: ${a}`);
for (const ext of unread) console.log(`  not read: ${ext} — add it to SCAN_EXT if it can carry copy`);
