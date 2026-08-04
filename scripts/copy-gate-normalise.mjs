// The copy-gate normaliser — one reading machine, shared by both gates.
// Wayfinder #57 wrote it inside check-dist-copy-gate.mjs; #68 moved it here so
// the source gate can use it too.
//
// The reason it is shared is the same reason copy-gate-patterns.mjs is shared: a
// transform present in one gate and absent from the other is worse than no
// transform, because it reads as covered. #68 measured that gap — the source
// gate missed "no</strong> surprises", "at&nbsp;cost" and a phrase wrapped
// across a newline, all three of which are ordinary authoring accidents, and all
// three of which only failed after a merge.
//
// ---------------------------------------------------------------------------
// WHAT A VIEW IS
//
// A claim can hide from any single normalisation, so a file is read through
// several VIEWS. Every view records, for each character it emits, the offset in
// the original bytes that character came from. A match is therefore a SPAN of
// original bytes, not a position in some derived string — which is what lets the
// dist gate count occurrences honestly across views, and what lets the source
// gate turn a match back into a line number.
//
// Applied in every view, because each is exactly what a browser does:
//   - character references decoded in ONE left-to-right pass. One pass is the
//     point: "&amp;#36;" renders as the literal text "&#36;", not "$", and a
//     second pass would invent a hit the reader never sees.
//   - invisible characters (zero-width space/joiner, soft hyphen, BOM) removed —
//     they exist only to split a word without showing it.
//   - whitespace collapsed to a single space, so a newline inside a phrase — the
//     accidental case — reads as the space it renders as. A run of TWO or more
//     newlines is a paragraph break instead, and collapses to a newline: it is
//     not a word space, and welding across it invents a phrase ("Everything is
//     at\n\ncost of nothing." is two paragraphs, not "at cost").
//
// NOT applied: homoglyph folding. Folding needs a confusables table, and a wrong
// entry in it invents failures in Spanish copy, which is full of legitimate
// non-ASCII. A confusable is instead caught where it is introduced —
// check-copy-gate.mjs fails on Cyrillic, Latin-lookalike Greek, fullwidth and
// mathematical letters in source, which is unambiguous there because no vendored
// code is in scope.
//
// ---------------------------------------------------------------------------
// FABRICATION, AND WHY THE TWO GATES TAKE DIFFERENT VIEW SETS
//
// Two of the views invent a phrase nobody ships, ON PURPOSE, accepting the noise
// to close a hole:
//   - "tags to a space" reads "<td>no</td><td>surprises</td>" as two words, and
//     a reader sees two table cells.
//   - "unknown reference to a space" does the same for a separator this file's
//     NAMED table does not know.
//
// Their twins — tag REMOVED, reference BLANKED — do not, because removing the
// separator removes the gap: the same markup reads "nosurprises". That property
// is REAL but it is not free, and #68 shipped a version where it was simply
// false: dropping a tag left any whitespace beside it behind, so the moment the
// markup was indented — which is to say, always — "<td>no</td>\n<td>surprises</td>"
// read as "no surprises" under the view documented as safe. Three independent
// reviews found it, and the control that had "proved" the property used the one
// formatting where it held, tags butted together on a single line. The
// inter-element-whitespace rule in view() is what makes it true; see the comment
// there, because the rule is the claim.
//
// The dist gate takes the fabricating views, because it measures the shipped
// promise and would rather fail loudly on a phantom than miss a real claim; it
// blesses each phantom once, by hand, in its own ALLOWED list.
//
// The source gate does NOT, and that asymmetry is deliberate. Its allowlist is a
// per-line pragma a human writes into the copy, and a pragma authorising a claim
// nobody made teaches the next reader that the gate cries wolf. What it gives up
// is a phrase whose ONLY separator is a tag boundary, whitespace or not —
// "<td>no</td><td>surprises</td>" and "<span>no</span> <span>surprises</span>"
// alike — which the dist gate catches before anything deploys, and which is not
// the accidental-authoring shape #68 was about.
//
// Callers therefore say which they want: includeFabricating: true is the dist
// gate's reading, false is the source gate's.
//
// WHAT NEITHER SET FIXES, so that no reader takes "non-fabricating" for
// "infallible": the tables below are still finite. NAMED holds a few dozen of
// HTML5's ~2200 named references, and only the fabricating "spaced" view covers
// the rest; REFERENCE bounds numeric references at 7 decimal / 6 hex digits and
// requires the closing semicolon, which browsers do not; and INVISIBLE holds
// eight code points out of a class of several thousand. All three are #80. Which
// FILE TYPES get the tag views at all is #81 — a .js bundle writing tag-split
// markup into innerHTML is read by neither gate's tag views today.

// ---------------------------------------------------------------------------

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
 *
 *  `css` enables CSS's own spelling of the same idea, "\69 " — 1-6 hex digits and
 *  an optional trailing space that is part of the escape rather than of the text.
 *  It is OFF by default and enabled only for stylesheets, because outside CSS that
 *  form is not syntax and reading it as one FABRICATES: every one of \a \b \c \d
 *  \e \f is a hex digit, and four of them decode to whitespace, so an ordinary
 *  JavaScript regex like /no\asurprises/ normalised to "no surprises" and failed
 *  the build on a phrase nobody wrote. It also decodes greedily — /at\dcost/ read
 *  "dc", not "d". #57 added the form for a real CSS evasion and that catch is
 *  kept; #68's adversarial review found the collateral. */
function decodeEscape(raw, i, css = false) {
  const braced = /^\\u\{([0-9a-fA-F]{1,6})\}/.exec(raw.slice(i, i + 10));
  if (braced) return [cp(parseInt(braced[1], 16)), braced[0].length];

  const u = /^\\u([0-9a-fA-F]{4})/.exec(raw.slice(i, i + 6));
  if (u) return [cp(parseInt(u[1], 16)), u[0].length];

  const x = /^\\x([0-9a-fA-F]{2})/.exec(raw.slice(i, i + 4));
  if (x) return [cp(parseInt(x[1], 16)), x[0].length];

  if (!css) return null;
  const hex = /^\\([0-9a-fA-F]{1,6})[ \t\n]?/.exec(raw.slice(i, i + 9));
  if (hex) return [cp(parseInt(hex[1], 16)), hex[0].length];

  return null;
}

// A "<" only opens a tag when what follows could begin one. HTML treats "< 5 min"
// as literal text, and so must this: an adversarial review hid
// "Insur<span>ance</span>" behind an earlier bare "<" by making the scan below
// swallow everything up to the next ">".
const TAG_START = /^<[a-zA-Z!/?]/;

/** The index just past the tag, comment or CDATA section starting at `raw[i]`, or
 *  -1 if it never closes.
 *
 *  Not an HTML parser — just enough of one that a ">" belonging to something else
 *  cannot end a tag early and spill the remainder into the text as copy. The
 *  previous one-line `indexOf(">")` was broken three ways by an adversarial
 *  review, each of which FABRICATED a forbidden phrase out of markup nobody
 *  wrote: a ">" inside an HTML comment ("at<!-- see /fees > cost -->market" read
 *  as "at cost"), inside a quoted attribute value, and inside an Astro attribute
 *  expression, where "=>" is an arrow function and not a tag end. */
function tagEnd(raw, i) {
  if (raw.startsWith("<!--", i)) {
    const end = raw.indexOf("-->", i + 4);
    return end === -1 ? -1 : end + 3;
  }
  if (raw.startsWith("<![CDATA[", i)) {
    const end = raw.indexOf("]]>", i + 9);
    return end === -1 ? -1 : end + 3;
  }
  let quote = "";
  let depth = 0;
  for (let j = i + 1; j < raw.length; j++) {
    const ch = raw[j];
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      if (depth > 0) depth--;
    } else if (ch === ">" && depth === 0) {
      return j + 1;
    }
  }
  return -1;
}

/**
 * One reading of `raw`.
 *
 * Returns { text, map } where map[n] is the offset in `raw` that text[n] came
 * from, so a match in `text` can be reported as a span of original bytes. Every
 * view of a file maps back to the same coordinates, which is what lets
 * overlapping matches from different views be recognised as one occurrence.
 */
function view(
  raw,
  { tags = "keep", unknownReference = "keep", escapes = false, cssEscapes = false },
) {
  const out = [];
  const map = [];
  // Where the run of whitespace waiting to be emitted began, and how many
  // newlines it contains — a run of two or more is a PARAGRAPH break, which is
  // not a word space and must not weld the words either side of it into a phrase.
  // Prose files are where this bites: in "Everything is at\n\ncost of nothing."
  // a reader sees two paragraphs and the collapse saw "at cost".
  let pendingSpace = -1;
  let pendingNewlines = 0;
  // Whether any text has been emitted since the last tag was dropped. See the
  // inter-element-whitespace rule below.
  let textSinceTag = true;

  const flush = () => {
    if (pendingSpace < 0) return;
    // TWO or more newlines, counted across the whole run — not "a newline that is
    // not the first character of the run", which is how this was first written and
    // which made an ordinary wrapped line ("no <!-- note -->\n  surprises") read as
    // a paragraph break and stop matching.
    out.push(pendingNewlines >= 2 ? "\n" : " ");
    map.push(pendingSpace);
    pendingSpace = -1;
    pendingNewlines = 0;
  };

  const emit = (ch, at) => {
    if (INVISIBLE.has(ch)) return;
    if (/\s/.test(ch)) {
      if (pendingSpace < 0) pendingSpace = at;
      if (ch === "\n") pendingNewlines++;
      return;
    }
    flush();
    out.push(ch);
    map.push(at);
    textSinceTag = true;
  };
  const emitAll = (s, at) => {
    for (const ch of s) emit(ch, at);
  };

  for (let i = 0; i < raw.length; ) {
    const ch = raw[i];

    if (tags !== "keep" && ch === "<" && TAG_START.test(raw.slice(i, i + 2))) {
      const end = tagEnd(raw, i);
      if (end !== -1) {
        if (tags === "space") {
          emit(" ", i);
        } else if (pendingSpace >= 0 && !textSinceTag) {
          // INTER-ELEMENT WHITESPACE — a dropped tag on BOTH sides of it, so it
          // renders as nothing and joining across it fabricates. This is the rule
          // that makes "tag removed" honestly non-fabricating, and #68 shipped
          // without it: "<td>no</td>\n<td>surprises</td>" read as "no surprises",
          // a phrase no reader sees, reported under the view documented as safe.
          // Whitespace with TEXT on either side is real and survives, which is
          // what keeps "Flat fees, <strong>no</strong> surprises." caught.
          pendingSpace = -1;
          pendingNewlines = 0;
        }
        textSinceTag = false;
        i = end;
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
      const hit = decodeEscape(raw, i, cssEscapes);
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

// Every view, in the order they are tried. A match is labelled with the FIRST
// view that saw it, so this order is part of the output, not an implementation
// detail: it is fixed here once rather than assembled per caller, so a caller
// that takes a subset cannot change what anything is called.
//
// The order puts each fabricating view immediately after the twin it exaggerates,
// so a hit both of them see is labelled with the quieter one. Read that label as
// "this did not need the noisy view" — evidence, not proof: the tables above are
// finite and view() only stopped fabricating under `drop` once #68's review
// forced the inter-element-whitespace rule.
const VIEWS = [
  { name: "plain",            markupOnly: false, fabricates: false, opts: {} },
  { name: "tags-removed",     markupOnly: true,  fabricates: false, opts: { tags: "drop" } },
  { name: "tags-as-space",    markupOnly: true,  fabricates: true,  opts: { tags: "space" } },
  { name: "escapes-decoded",  markupOnly: false, fabricates: false, opts: { escapes: true } },
  { name: "entities-blanked", markupOnly: true,  fabricates: false, opts: { tags: "drop", unknownReference: "blank" } },
  { name: "entities-spaced",  markupOnly: false, fabricates: true,  opts: { tags: "space", unknownReference: "space" } },
];

/**
 * Every reading of one file, as [{ name, text, map }].
 *
 * `markup` decides whether the tag treatments apply. `includeFabricating` adds
 * the views that can invent a phrase — see the header for why the dist gate
 * wants them and the source gate does not.
 *
 * Character references are decoded in every view, markup or not, because a
 * bundle that assigns "&#105;nsurance" to innerHTML publishes the word.
 */
export function viewsOf(raw, { markup, includeFabricating, css = false }) {
  return VIEWS.filter(
    (v) => (markup || !v.markupOnly) && (includeFabricating || !v.fabricates),
  ).map((v) => ({
    name: v.name,
    ...view(raw, { ...v.opts, ...(markup ? {} : { tags: "keep" }), cssEscapes: css }),
  }));
}

/** Merge overlapping spans. Two matches that overlap in the original bytes are
 *  the same claim seen through two views; disjoint ones are separate claims. */
export function countOccurrences(spans) {
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

/** Every match of `patterns` in every view, as
 *  [{ at, text, view, span: [startOffset, endOffset) }] in original-byte
 *  coordinates. Both gates match the same way; they differ only in what they do
 *  with the spans afterwards. */
export function matchesIn(views, patterns) {
  const out = [];
  for (const { name, text, map } of views) {
    for (const [at, { re }] of patterns.entries()) {
      const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
      for (const m of text.matchAll(global)) {
        if (!m[0].length) continue;
        out.push({
          at,
          text: m[0].toLowerCase(),
          view: name,
          span: [map[m.index], map[m.index + m[0].length - 1] + 1],
        });
      }
    }
  }
  return out;
}
