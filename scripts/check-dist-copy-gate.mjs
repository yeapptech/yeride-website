// Copy gate, second layer — the same §5 pattern list, run over dist/ after the
// build. Wayfinder #57.
//
// WHY A SECOND GATE. This one measures the promise itself — a forbidden claim
// must not reach the shipped site — by reading what is actually shipped.
//
// That is a smaller gap than it was. #57 wrote this gate because the source gate
// was a line matcher over source text, blind to a phrase broken across a tag, an
// HTML entity or a newline; #68 then moved this file's normaliser into
// scripts/copy-gate-normalise.mjs and gave the source gate the same reading, so
// all three of those now fail at the point of authorship instead of after a
// merge. What is left here, and it is not nothing:
//   - files this repo does not author — vendored bundles and brand assets, which
//     are in dist/ and not in src/.
//   - text the BUILD introduces, rather than the author.
//   - literal concatenation Rollup folds: "insur" + "ance" is two harmless
//     strings in the source and one word in the bundle.
//   - the two views that can fabricate, which the source gate declines so that no
//     per-line pragma ever has to bless a phantom.
// And it is the only layer that measures the thing itself rather than a proxy for
// it, which is why it gates the deploy.
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
// dist/_astro/FeeSchedule.*.js and never appears in dist/fees/index.html. That
// same fact is why character references are decoded in SCRIPT files too: a
// bundle that assigns "&#105;nsurance" to innerHTML publishes the word.
//
// ---------------------------------------------------------------------------
// HOW IT READS A FILE — several views, one count.
//
// A claim can hide from any single normalisation, so each file is read through
// several VIEWS. Every view records, for each character it emits, the offset in
// the original bytes that character came from. A match is therefore a SPAN of
// original bytes, not a position in some derived string.
//
// That is what makes counting honest. Overlapping spans from different views are
// ONE occurrence — the same claim seen twice. Disjoint spans are DIFFERENT
// occurrences, however they were found. An earlier revision of this file took
// the maximum count across views instead, and an independent review broke it in
// one line: a claim in an alt attribute (visible only to the untouched view) plus
// a tag-split claim (visible only to the tag-stripped view) both counted 1, so a
// single "×1" allowance passed two shipped claims on the one page this gate
// exists to protect. Spans cannot be fooled that way.
//
// The reading machine itself — the views, the character-reference decoding, the
// invisible-character removal, the whitespace collapse and the position map that
// makes spans possible — lives in scripts/copy-gate-normalise.mjs, shared with
// the source gate (#68). One list AND one normaliser: a transform present in one
// gate and absent from the other reads as covered when it is not. Read that file
// for what each view is for and why this gate asks for the two that can
// fabricate while the source gate does not.
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
//   - a claim rendered from base64, URL-encoding or any other payload this does
//     not decode. Decoding everything a browser can execute is a losing race; the
//     source gate is the layer that sees such a string being authored.
//
// KNOWN FALSE-POSITIVE SOURCES, both deliberate:
//   - the "tags to a space" view, as described above.
//   - §5's /\$[ \t]?\d/ matches a regex backreference like "$1" in a minified
//     vendor chunk. Nothing in dist/ trips it today, but a dependency bump can.
//     The pattern is §5's and shared with the source gate, so it is not narrowed
//     here; the failure is loud and one ALLOWED entry retires it.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";

import { PATTERNS } from "./copy-gate-patterns.mjs";
import { countOccurrences, matchesIn, viewsOf } from "./copy-gate-normalise.mjs";

const ROOT = "dist";
// Case-insensitive: a page served as .HTML is still a page. GitHub Pages serves
// .htm and .xhtml as text/html too.
const SCAN_EXT = /\.(html?|xhtml|js|mjs|cjs|json|map|svg|css|txt|xml|webmanifest)$/i;
const MARKUP_EXT = /\.(html?|xhtml|svg|xml)$/i;
// Extensions that cannot carry readable copy. Everything else that is not
// scanned gets named in the output, on the failure path as well as the success
// one: a file type this gate silently ignored would otherwise read as a file type
// it cleared.
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|pdf|mp4|webm|zip|gz)$/i;

// Rollup stamps a content hash into the assets it emits, so the filename changes
// whenever the file does. The allowlist is keyed to the name with that segment
// removed. Only files under _astro/ are treated this way — page paths and
// anything copied verbatim from public/ keep their names, and stripping a
// dot-segment from those would mangle a legitimate name like
// "fee.schedule.json" into "fee.json".
const HASHED_DIR = "_astro/";
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

  // The legal pages (#44). Two of these sentences DENY that YeRide has
  // insurance; the other three name the vehicle insurance policy number as a
  // field the app collects. §5 cannot tell either from a claim, and both are the
  // honest thing to publish, so they ship. When #48 lands the denials become
  // false and must be rewritten — which is why the entries name it rather than
  // being deleted.
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

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    try {
      // A symlink is resolved rather than trusted; a dangling one is skipped
      // instead of throwing out of the whole walk.
      return statSync(path).isDirectory() ? walk(path) : [path];
    } catch {
      return [];
    }
  });
}

const keyOf = (path) => {
  const rel = path.replace(/^dist[/\\]/, "").replace(/\\/g, "/");
  return rel.startsWith(HASHED_DIR) ? rel.replace(CONTENT_HASH, "") : rel;
};

/** The extension used in the "not read" notice. A dotfile is its own name, not
 *  an extension — ".nojekyll" is a file called .nojekyll. */
const extensionOf = (path) => {
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "(no extension)";
  return name.slice(dot);
};

let everything;
try {
  everything = walk(ROOT);
} catch {
  console.error(`✗ dist copy gate — no ${ROOT}/ to scan`);
  console.error(`  This runs after "astro build". Run "npm run build", not this script alone.`);
  process.exit(1);
}

const files = everything.filter((p) => SCAN_EXT.test(p));
const errors = [];
const allowed = [];
const unreadTypes = new Set(
  everything.filter((p) => !SCAN_EXT.test(p) && !BINARY.test(p)).map(extensionOf),
);

// A Map, so two entries for the same file and string cannot both exist with only
// one of them ever reachable.
const index = new Map();
for (const [at, entry] of ALLOWED.entries()) {
  const id = `${entry.file}\u0000${entry.text.toLowerCase()}`;
  if (index.has(id)) {
    errors.push(`ALLOWED has two entries for ${entry.file} "${entry.text}" — delete one`);
    continue;
  }
  index.set(id, { ...entry, at, used: false });
}

// Two dist files whose keys collapse together would share one allowance, so one
// blessing would silently cover the other.
const byKey = new Map();
for (const path of files) {
  const key = keyOf(path);
  if (byKey.has(key)) {
    errors.push(
      `${path} and ${byKey.get(key)} both key to "${key}" — one allowlist entry would cover both`,
    );
  } else {
    byKey.set(key, path);
  }
}

for (const path of files) {
  const key = keyOf(path);
  // includeFabricating: this gate takes the two views that can invent a phrase —
  // it measures the shipped promise and would rather fail on a phantom than miss
  // a real claim, and ALLOWED is where each phantom gets blessed. The source gate
  // passes false; copy-gate-normalise.mjs explains the asymmetry.
  const views = viewsOf(readFileSync(path, "utf8"), {
    markup: MARKUP_EXT.test(path),
    includeFabricating: true,
  });

  // (pattern, matched text) -> { spans, view }. Keyed by the text as well as the
  // pattern, because one alternation matches several words — §5's
  // /\b(seguros?|aseguranza|p[óo]liza)\b/ finds both halves of "póliza de
  // seguro" — and collapsing those into one entry would make the allowlist
  // unreadable. Spans are original-byte ranges, so within a key a match found by
  // several views is one occurrence, not several; `view` names the first one
  // that saw it, which is why matchesIn walks views outermost.
  const found = new Map();
  for (const { at, text, view: name, span } of matchesIn(views, PATTERNS)) {
    const id = `${at}\u0000${text}`;
    const seen = found.get(id) ?? { at, spans: [], text, view: name };
    seen.spans.push(span);
    found.set(id, seen);
  }

  for (const { at, spans, text, view: viewName } of found.values()) {
    const { why } = PATTERNS[at];
    const count = countOccurrences(spans);
    const where = `${key}  "${text}" ×${count} [${viewName}]`;
    const entry = index.get(`${key}\u0000${text}`);

    if (!entry) {
      errors.push(`${where} — ${why}`);
      continue;
    }
    entry.used = true;
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

for (const entry of index.values()) {
  if (entry.used) continue;
  errors.push(
    `${entry.file}  "${entry.text}" ×${entry.count} is allowed but no longer appears — delete the ` +
      `entry from scripts/check-dist-copy-gate.mjs`,
  );
}

const notice = [...unreadTypes].sort();

if (errors.length) {
  console.error(`✗ dist copy gate (${files.length} files)`);
  for (const e of errors) console.error(`  ${e}`);
  for (const ext of notice) console.error(`  not read: ${ext} — add it to SCAN_EXT if it can carry copy`);
  console.error(`\n  The list is docs/copy-map.md §5, on the copy-map/en-es branch until it merges:`);
  console.error(`    git show origin/copy-map/en-es:docs/copy-map.md`);
  console.error(`  A source pragma cannot reach here — it is stripped by the build. A string that`);
  console.error(`  has to ship without being a claim is blessed in this script's ALLOWED list,`);
  console.error(`  keyed to the path above, with a reason naming the issue that retires it.`);
  process.exit(1);
}

console.log(`✓ dist copy gate (${files.length} files)`);
for (const a of allowed) console.log(`  allowed: ${a}`);
for (const ext of notice) console.log(`  not read: ${ext} — add it to SCAN_EXT if it can carry copy`);
