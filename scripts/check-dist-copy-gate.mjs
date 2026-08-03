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
// The views, and what each is for:
//   - tags kept          the plain reading; also the only view that sees
//                        attribute text (alt, title, content), since stripping a
//                        tag takes its attributes with it.
//   - tags removed       catches "Insur<span>ance</span>". It cannot fabricate a
//                        multi-word phrase: removing a tag removes the gap, so
//                        "<li>zero</li><li>markup</li>" becomes "zeromarkup".
//   - tags to a space    catches a phrase split across two elements. This is the
//                        one view that CAN fabricate — "<td>no</td>
//                        <td>surprises</td>" reads as two cells — so every hit
//                        names the view that produced it, and a fabricated one is
//                        blessed once in ALLOWED below.
//   - unknown references blanked / spaced
//                        the NAMED table below cannot hold all ~2200 HTML5
//                        entities. Rather than pretend, anything it does not know
//                        is ALSO tried as "" and as " ", so "no&NewLine;surprises"
//                        is caught without needing &NewLine; in the table.
//   - escapes decoded    \uXXXX, \xXX, \u{...} and CSS's "\69 " form. Applied to
//                        markup as well as scripts, because an inline <script> in
//                        a built page is markup by extension and a bundle by
//                        content.
//
// Applied in every view, because each is exactly what a browser does:
//   - character references decoded in ONE left-to-right pass. One pass is the
//     point: "&amp;#36;" renders as the literal text "&#36;", not "$", and a
//     second pass would invent a hit the reader never sees.
//   - invisible characters (zero-width space/joiner, soft hyphen, BOM) removed —
//     they exist only to split a word without showing it.
//   - whitespace collapsed to single spaces, so a newline inside a phrase — the
//     accidental case — reads as the space it renders as.
//
// NOT applied: homoglyph folding. Folding needs a confusables table, and a wrong
// entry in it invents failures in Spanish copy, which is full of legitimate
// non-ASCII. A confusable is instead caught where it is introduced —
// check-copy-gate.mjs fails on Cyrillic, Latin-lookalike Greek, fullwidth and
// mathematical letters in source, which is unambiguous there because no vendored
// code is in scope.
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
// Normalisation

const REFERENCE = /^&(#[xX][0-9a-fA-F]{1,6}|#\d{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/;

// The named references Astro emits, plus the ones that would be used to split or
// disguise a word. This is NOT the full HTML5 set and does not try to be — the
// "unknown reference blanked / spaced" views cover whatever is missing.
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  nbsp: " ", ensp: " ", emsp: " ", thinsp: " ", hairsp: " ", puncsp: " ",
  newline: "\n", tab: "\t",
  shy: "", zwnj: "", zwj: "", lrm: "", rlm: "",
  mdash: "—", ndash: "–", hellip: "…", middot: "·",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  dollar: "$", cent: "¢", pound: "£", euro: "€", yen: "¥",
  copy: "©", reg: "®", trade: "™", deg: "°", sect: "§", para: "¶",
};

// Written as escapes, not as the characters themselves: these are invisible, so a
// literal class here would be unreviewable, would make this file read as binary
// to grep and file(1), and one lost byte in an editor would silently narrow the
// gate. Soft hyphen, the zero-width/bidi block, word joiner, BOM.
const INVISIBLE = new Set([
  "\u00AD", "\u200B", "\u200C", "\u200D", "\u200E", "\u200F", "\u2060", "\uFEFF",
]);

const cp = (n) => (Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "");

/** The decoded value of one character reference, or null if this table cannot
 *  resolve it. Numeric references always resolve; named ones may not. */
function decodeReference(body) {
  if (body[0] === "#") {
    const hex = body[1] === "x" || body[1] === "X";
    const n = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
    return Number.isNaN(n) ? null : cp(n);
  }
  const named = NAMED[body.toLowerCase()];
  return named === undefined ? null : named;
}

/** A JS or CSS escape at `raw[i]`, as [decodedText, consumedLength], or null.
 *  CSS spells the same idea "\69 " — 1-6 hex digits and an optional trailing
 *  space that is part of the escape rather than of the text. */
function decodeEscape(raw, i) {
  const braced = /^\\u\{([0-9a-fA-F]{1,6})\}/.exec(raw.slice(i, i + 10));
  if (braced) return [cp(parseInt(braced[1], 16)), braced[0].length];

  const u = /^\\u([0-9a-fA-F]{4})/.exec(raw.slice(i, i + 6));
  if (u) return [cp(parseInt(u[1], 16)), u[0].length];

  const x = /^\\x([0-9a-fA-F]{2})/.exec(raw.slice(i, i + 4));
  if (x) return [cp(parseInt(x[1], 16)), x[0].length];

  const css = /^\\([0-9a-fA-F]{1,6})[ \t\n]?/.exec(raw.slice(i, i + 9));
  if (css) return [cp(parseInt(css[1], 16)), css[0].length];

  return null;
}

/**
 * One reading of `raw`.
 *
 * Returns { text, map } where map[n] is the offset in `raw` that text[n] came
 * from, so a match in `text` can be reported as a span of original bytes. Every
 * view of a file maps back to the same coordinates, which is what lets
 * overlapping matches from different views be recognised as one occurrence.
 */
function view(raw, { tags = "keep", unknownReference = "keep", escapes = false }) {
  const out = [];
  const map = [];
  let pendingSpace = -1;

  const emit = (ch, at) => {
    if (INVISIBLE.has(ch)) return;
    if (/\s/.test(ch)) {
      if (pendingSpace < 0) pendingSpace = at;
      return;
    }
    if (pendingSpace >= 0) {
      out.push(" ");
      map.push(pendingSpace);
      pendingSpace = -1;
    }
    out.push(ch);
    map.push(at);
  };
  const emitAll = (s, at) => {
    for (const ch of s) emit(ch, at);
  };

  for (let i = 0; i < raw.length; ) {
    const ch = raw[i];

    if (tags !== "keep" && ch === "<") {
      const end = raw.indexOf(">", i);
      if (end !== -1) {
        if (tags === "space") emit(" ", i);
        i = end + 1;
        continue;
      }
    }

    if (ch === "&") {
      const hit = REFERENCE.exec(raw.slice(i, i + 36));
      if (hit) {
        const decoded = decodeReference(hit[1]);
        if (decoded !== null) emitAll(decoded, i);
        else if (unknownReference === "blank") void 0;
        else if (unknownReference === "space") emit(" ", i);
        else emitAll(hit[0], i);
        i += hit[0].length;
        continue;
      }
    }

    if (escapes && ch === "\\") {
      const hit = decodeEscape(raw, i);
      if (hit) {
        emitAll(hit[0], i);
        i += hit[1];
        continue;
      }
    }

    emit(ch, i);
    i++;
  }

  return { text: out.join(""), map };
}

/** Every reading of one file. Markup gets the tag treatments; everything else is
 *  read once plain and once with escapes resolved. Character references are
 *  decoded everywhere, because a bundle that writes them into innerHTML
 *  publishes them. */
function viewsOf(path, raw) {
  const named = [];
  const add = (name, opts) => named.push({ name, ...view(raw, opts) });

  if (MARKUP_EXT.test(path)) {
    add("as-shipped", { tags: "keep" });
    add("tags-removed", { tags: "drop" });
    add("tags-as-space", { tags: "space" });
    add("escapes-decoded", { tags: "keep", escapes: true });
    add("entities-blanked", { tags: "drop", unknownReference: "blank" });
    add("entities-spaced", { tags: "space", unknownReference: "space" });
    return named;
  }

  add("as-shipped", {});
  add("escapes-decoded", { escapes: true });
  add("entities-spaced", { unknownReference: "space" });
  return named;
}

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

/** Merge overlapping spans. Two matches that overlap in the original bytes are
 *  the same claim seen through two views; disjoint ones are separate claims. */
function countOccurrences(spans) {
  const sorted = [...spans].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let count = 0;
  let end = -1;
  for (const [start, stop] of sorted) {
    if (start >= end) {
      count++;
      end = stop;
    } else if (stop > end) {
      end = stop;
    }
  }
  return count;
}

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
  const views = viewsOf(path, readFileSync(path, "utf8"));

  // (pattern, matched text) -> { spans, view }. Keyed by the text as well as the
  // pattern, because one alternation matches several words — §5's
  // /\b(seguros?|aseguranza|p[óo]liza)\b/ finds both halves of "póliza de
  // seguro" — and collapsing those into one entry would make the allowlist
  // unreadable. Spans are original-byte ranges, so within a key a match found by
  // several views is one occurrence, not several.
  const found = new Map();
  for (const { name, text, map } of views) {
    for (const [at, { re }] of PATTERNS.entries()) {
      const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
      for (const m of text.matchAll(global)) {
        if (!m[0].length) continue;
        const matched = m[0].toLowerCase();
        const id = `${at}\u0000${matched}`;
        const span = [map[m.index], map[m.index + m[0].length - 1] + 1];
        const seen = found.get(id) ?? { at, spans: [], text: matched, view: name };
        seen.spans.push(span);
        found.set(id, seen);
      }
    }
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
