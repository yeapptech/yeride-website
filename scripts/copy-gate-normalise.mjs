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
//   - invisible characters removed — they exist only to split a word without
//     showing it. The whole class, by Unicode property (Default_Ignorable ∪ Cf):
//     #80 replaced an eight-member list that let 4,198 others through.
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
// "infallible". #80 closed two of the three tables that were the EXAMPLES of a
// class rather than the class — invisible characters are now the Unicode property
// (4,206 code points, not 8) and numeric references now follow HTML5 (unbounded
// digits, optional semicolon). What is left is ONE finite table and it is named
// here rather than implied:
//
//   - NAMED holds a few dozen of HTML5's ~2200 named references. A reference
//     outside it is UNKNOWN, not decoded, and only the fabricating "spaced" view
//     covers it — so in the source gate, which declines that view, a browser-known
//     separator this table does not know is a miss. The full table was declined
//     rather than forgotten: it is ~2200 entries of generated data in a file whose
//     value is that a human can read it, and both gates are dependency-free by
//     design (#41), so there is no parser to borrow it from. #80's answer is that
//     the class worth naming is the one an author reaches for — the space-like and
//     the invisible — and NAMED holds those.
//
//     #80 asked a second half with it: does the SOURCE gate then need a
//     non-fabricating "unknown reference blanked" view for NON-markup too? The
//     answer is no, and it is recorded here because the behaviour alone does not
//     say it. The reference views stay markupOnly, so a .ts file is read as plain
//     text and escapes only. A "&" in a .ts string is not a reference: Astro
//     escapes an interpolated string before it reaches the page, so `"insur&foo;
//     ance"` renders with the ampersand intact and decoding it here would invent a
//     word the reader never sees — a fabrication, in the gate that declines those.
//     The case that WOULD publish it, a bundle assigning that string to innerHTML,
//     is not a reference question at all; it is which file types get the markup
//     views — settled by #81, which reads everything SERVED as markup (all of
//     dist/, all of public/) and leaves compiled source under src/ as plain text.
//     So that bundle IS read as markup now, at the dist gate, and the .ts under
//     src/ it was compiled from still is not.
//   - "entities-blanked" is marked non-fabricating on the tag argument (removing a
//     separator removes the gap), which holds for a reference a BROWSER also drops
//     and not for one it renders literally: "insur&foo;ance" is "insur&foo;ance" on
//     screen and "insurance" under that view. Kept anyway, and the reason is not
//     the tag reason: a bogus reference inside a word is never an authoring
//     accident, so this cannot cry wolf the way "tags-as-space" does.
//   - NAMED is matched case-INSENSITIVELY while HTML5 is case-sensitive, so
//     "&Nbsp;" decodes here and renders literally in a browser. Left alone: it can
//     only over-accuse, and this file's failures worth chasing are misses.
//
// Which FILE TYPES get the tag views at all is NOT decided here. Callers pass
// `markup`, and scripts/copy-gate-files.mjs holds the rule they pass it from,
// with the measurements #81 settled it on.

// ---------------------------------------------------------------------------

// HTML5's numeric forms: unbounded digits and an OPTIONAL closing semicolon,
// because that is what a browser accepts. #80 measured the bounded, semicolon-
// required version letting "&#00000105;nsurance", "&#x0000069;nsurance",
// "&#105nsurance" and "&#x69nsurance" all through both gates green, every one of
// which renders as the forbidden word — and leading zeros are not exotica, CMS
// exports carry them routinely. Sticky rather than matched against a slice, so
// "unbounded" is true rather than true-up-to-the-slice.
const NUMERIC = /&#(?:([xX])([0-9a-fA-F]+)|(\d+));?/y;
// The name run after "&". 31 characters is not a limit HTML5 imposes; it is
// simply longer than any name in NAMED, which is all this file can resolve.
const NAME_RUN = /&([a-zA-Z][a-zA-Z0-9]{0,30})/y;

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

// The invisible class, as a Unicode PROPERTY rather than as eight of its members.
// #59 settled the analogous question by inverting a blocklist into a positive
// rule; copy here is not ASCII, so that inversion is not available, but the
// principle is — name the class, do not enumerate it. The old set held eight code
// points and 4,198 more passed: every variation selector (so "insur<U+FE0F>ance"
// was green in both gates), most of the bidi block the set claimed to cover, the
// invisible maths operators, and the combining grapheme joiner.
//
// A property test rather than a literal class for the same reason the old set was
// written as escapes: these characters are invisible, so a literal would be
// unreviewable, would make this file read as binary to grep and file(1), and one
// byte lost in an editor would silently narrow the gate. A property cannot be
// narrowed by an editor at all.
//
// One honest edge: the four Hangul fillers (U+115F, U+1160, U+3164, U+FFA0) are
// Default_Ignorable yet render with width, so dropping one could weld two words a
// reader sees apart. Dropping is still right — the alternative lets a filler split
// a word invisibly, which is the whole subject of #80 — and neither language this
// site ships can contain one.
//
// U+FEFF is both Cf and JavaScript whitespace. It is tested here FIRST, exactly as
// the old set was, so it is still removed rather than collapsed to a space.
const IGNORABLE = /^[\p{Default_Ignorable_Code_Point}\p{Cf}]$/u;

// Which of NAMED a browser also accepts WITHOUT the closing semicolon. Not a
// style choice and not all of NAMED: HTML5 fixes one historical list, and "&nbsp"
// is on it while "&zwnj" is not. Both directions cost something real — omitting
// "nbsp" leaves #80's "at&nbspcost" reading as "at cost" to every browser and as
// nothing to this gate, and adding "mdash" would decode text no browser decodes,
// which is fabrication inside a view this file documents as non-fabricating.
const NAMED_LEGACY = new Set([
  "amp", "lt", "gt", "quot", "nbsp", "shy",
  "copy", "reg", "deg", "sect", "para", "cent", "pound", "yen", "middot",
]);

const cp = (n) => (Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "");

/** One numeric reference's value, by HTML5's rules rather than by clamping.
 *
 *  Out of range, a lone surrogate and a null all render as U+FFFD — a character
 *  the reader SEES. Returning the empty string for those, as the clamp did, welded
 *  the text either side together: "insur&#99999999;ance" read as the forbidden
 *  word in a view documented as non-fabricating.
 *
 *  NOT applied: HTML5's windows-1252 mapping for 0x80-0x9F ("&#151;" as an em
 *  dash). Declined rather than overlooked — to every §5 pattern a raw C1 control
 *  and its cp1252 glyph are alike non-word characters, so the substitution cannot
 *  change a verdict. Add the table if a pattern ever keys on a dash or a curly
 *  quote as a literal. */
function numericCodePoint(n) {
  if (!Number.isFinite(n) || n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return "�";
  return String.fromCodePoint(n);
}

/** The character reference at `raw[i]`, as { length, decoded } — where a null
 *  `decoded` means "a reference this table cannot resolve", so the caller's
 *  unknownReference policy applies, and a null RESULT means "not a reference at
 *  all", so the ampersand is emitted as text.
 *
 *  The no-semicolon named form takes the LONGEST prefix that is a legacy name,
 *  which is what a browser does: "at&nbspcost" is "at " followed by "cost", not
 *  an unknown reference named "nbspcost".
 *
 *  Residue, stated rather than implied away: HTML5 suppresses that form inside an
 *  ATTRIBUTE VALUE when the next character is "=" or alphanumeric, precisely so a
 *  query string survives. This file has no attribute context, so it applies the
 *  text-content rule everywhere and will over-decode href="?a=1&regs=2". That
 *  direction is the safe one — over-decoding accuses, under-decoding misses. */
function readReference(raw, i) {
  NUMERIC.lastIndex = i;
  const num = NUMERIC.exec(raw);
  if (num) {
    const digits = num[1] ? num[2] : num[3];
    return { length: num[0].length, decoded: numericCodePoint(parseInt(digits, num[1] ? 16 : 10)) };
  }

  NAME_RUN.lastIndex = i;
  const run = NAME_RUN.exec(raw);
  if (!run) return null;
  const name = run[1];

  if (raw[i + 1 + name.length] === ";") {
    const named = NAMED[name.toLowerCase()];
    return { length: name.length + 2, decoded: named === undefined ? null : named };
  }

  for (let len = name.length; len > 0; len--) {
    const prefix = name.slice(0, len).toLowerCase();
    if (NAMED_LEGACY.has(prefix)) return { length: len + 1, decoded: NAMED[prefix] };
  }
  return null;
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
//
// #99. Testing only the NEXT CHARACTER was that rule at its weakest, and #81 made
// it load-bearing by reading minified JavaScript as markup. "r<t.length" passes a
// next-character test — "t" is a letter — and then tagEnd runs to a ">" four
// functions away. Measured on the build at the time of #81, and reproduced to the
// byte before this change:
//
//   dist/_astro/FareEstimatePage….js  61,608 B  38 spans  24,678 swallowed (40.1%)  longest 16,251
//   dist/_astro/FeeSchedule….js       13,043 B  89 spans   2,327 swallowed (17.8%)
//
// It cuts both ways: a claim INSIDE such a span is invisible to the tag views (and
// the plain view does not rescue it — there the claim is still split by its tag),
// and the span DELETED welds the identifiers either side into a phrase nobody
// wrote ("rates=i0)flat").
//
// THE INSTRUMENT IS THE OPENING TEST, NOT A LENGTH BOUND, and #99 weighed the
// bound first because it is the obvious fix. It is a bad one here: the longest
// GENUINE tag in this repo's own output is 2,825 bytes of SVG path data, with a
// second at 1,273 B and then a cliff to 434 B, so a bound safe for real markup has
// to sit above ~3 KB — which removes the two largest false spans and leaves the
// rest, buying a partial fix at the price of a constant that silently stops
// reading a real asset as markup the day the brand lockup grows. Length does not
// separate the two things; SHAPE does. A JavaScript comparison is not shaped like
// a tag and never was:
//
//   opens a tag        <div class="x">   <br/>   </p>   <Foo.Bar />   <!-- … -->
//   does not           r<t.length   i<n;   x<a[i]   e<r&&t   i<len)
//
// So the rule below reads the tag NAME and requires it to end the way a tag name
// ends — at whitespace, "/" or ">". Everything in the right-hand column fails on
// the character after the name, before tagEnd is ever called, and the "<" is
// emitted as ordinary text, which is what a browser does with it too.
//
// Two deliberate narrowings, both places where HTML5 is MORE permissive than this
// and being more permissive would discriminate nothing:
//
//   - The name charset is what real markup uses, not HTML5's "anything until
//     whitespace, / or >". Under HTML5's own rule "r<t.length)&&(x>y" has a tag
//     name of "t.length)&&(x" — perfectly legal, and exactly the span this ticket
//     exists to stop. A tag named "t.length)&&(x" does not appear in authored
//     markup; letters, digits, "-", "_", ":" and "." are what does, "." and ":"
//     because of Astro's <Namespace.Component> and XML's xml:lang.
//   - After "<!" only the three forms that actually occur are accepted — a
//     comment, CDATA and a doctype. HTML5 turns any other "<!x" into a bogus
//     comment running to the next ">", and "a<!b" is ordinary JavaScript: the
//     widened form welds "rates,n=id,flat" out of a minified comparison, which is
//     the control that earns this clause.
//
// The processing-instruction clause is NOT narrowed the same way, and the residue
// is stated rather than left to be discovered: "<?x" opens a span, so a contrived
// "r<?t:v … a>b" would still weld. It is left alone because that sequence is not
// valid JavaScript in the first place — unlike "a<!b", which is — and because the
// only real writer of the form is an XML declaration, of which the built tree
// contains none today. Narrow it to "<?xml" the day one of those changes.
//
// This can only ever make the tag views read LESS as a tag. A real tag it declined
// would be a miss, not a fabrication, and the fixture in copy-gate-normalise.test.mjs
// carries the shapes this repo's own output actually contains.
const TAG_OPEN = /<(?:!--|!\[CDATA\[|!doctype|\?[a-z]|\/?[a-z][a-z0-9:._-]*(?=[\s/>]|$))/iy;

/** Whether a tag, comment or CDATA section opens at `raw[i]`. Sticky rather than
 *  applied to a slice: the name run is unbounded, and slicing a fixed two
 *  characters is what made the old test read only the first of them. */
function opensTag(raw, i) {
  TAG_OPEN.lastIndex = i;
  return TAG_OPEN.test(raw);
}

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

  // `ch` is one CODE POINT, which may be two UTF-16 units. It is pushed unit by
  // unit against the same origin offset so that `map` stays index-aligned with
  // `text` — without that, an astral character would slide every span after it.
  // The whole reason to work in code points is that the ignorable class reaches
  // past the BMP (the tag characters at U+E0020-E007F, the variation selectors
  // supplement), and a lone surrogate matches no Unicode property at all.
  const emit = (ch, at) => {
    if (IGNORABLE.test(ch)) return;
    if (/\s/.test(ch)) {
      if (pendingSpace < 0) pendingSpace = at;
      if (ch === "\n") pendingNewlines++;
      return;
    }
    flush();
    for (let k = 0; k < ch.length; k++) {
      out.push(ch[k]);
      map.push(at);
    }
    textSinceTag = true;
  };
  const emitAll = (s, at) => {
    for (const ch of s) emit(ch, at);
  };

  for (let i = 0; i < raw.length; ) {
    const ch = raw[i];

    if (tags !== "keep" && ch === "<" && opensTag(raw, i)) {
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
      const ref = readReference(raw, i);
      if (ref) {
        if (ref.decoded !== null) emitAll(ref.decoded, i);
        else if (unknownReference === "blank") void 0;
        else if (unknownReference === "space") emit(" ", i);
        else emitAll(raw.slice(i, i + ref.length), i);
        i += ref.length;
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

    // By code point, not by code unit: see emit(). The three tests above are all
    // on BMP characters, so reading raw[i] for them stays correct.
    const point = String.fromCodePoint(raw.codePointAt(i));
    emit(point, i);
    i += point.length;
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
    // Carried out of VIEWS rather than left behind, because permissionsIn below
    // has to tell an honest reading from an exaggerated one: a view that can
    // invent a phrase may ACCUSE, never excuse.
    fabricates: v.fabricates,
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

/** A pattern as a fresh /g copy, so matchAll can walk every occurrence. Fresh on
 *  every call rather than cached: a /g regex carries lastIndex, and one shared
 *  across files or views would skip matches depending on what was read before it.
 *  Written once because matchesIn and permissionsIn both need it, and a
 *  withdrawal reading occurrences differently from an accusation is exactly the
 *  drift one shared normaliser exists to prevent. */
const globalise = (re) =>
  new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);

/** The original-byte offsets a permitted phrase is READ FROM, per pattern index —
 *  the one direction in which a view is allowed to make a gate say less.
 *
 *  Wayfinder #82. §5 has one permitted exception, "no surge today", and it used
 *  to be a negative lookahead on the forbidden pattern. That could only ever work
 *  on the exact bytes the lookahead saw: both gates read normalised text purely to
 *  ACCUSE — the raw verdict is final and a view can only add hits — so splitting
 *  the permitted phrase any of the three ways this file exists to see through
 *  ("no surge&nbsp;today", a wrapped line, "no surge <b>today</b>") failed the
 *  build on copy §3.4 expressly allows, with every view able to see it was
 *  permitted and none of them asked.
 *
 *  THREE BOUNDS, and they are the whole safety argument. A withdrawal is the only
 *  thing in either gate that turns a failure into a pass, so it is deliberately
 *  hard to reach:
 *
 *  1. Only a pattern that DECLARES `permits` can ever be withdrawn. Every other
 *     pattern keeps the old contract exactly — the raw verdict is final.
 *  2. A withdrawal needs a POSITIVE match of the permitted phrase, never the
 *     absence of the forbidden one. That is the bound #82 asked for: normalisation
 *     is lossy in places (#80 lists which), and "the pattern stopped matching once
 *     normalised" would let a loss exonerate a real claim. Only §5's own permitted
 *     words can excuse anything.
 *  3. Only a NON-FABRICATING view may excuse. The dist gate reads the two views
 *     that can invent a phrase, and letting one of those excuse would open a
 *     laundering shape it exists to close — "no surge<td></td>today" reads as the
 *     permitted phrase under "tags-as-space" and as "no surgetoday" to a reader.
 *     Fabrication is allowed to raise the alarm; it is not allowed to call it off.
 *
 *  A fourth bound is isPermitted's, not this function's: the accused bytes have to
 *  be bytes the permitted phrase ACTUALLY CONTRIBUTED, so a permitted phrase
 *  elsewhere in the file — or elsewhere on the same line — cannot excuse a bare
 *  claim.
 *
 *  Which is why a permission is a SET of original offsets and not a span. The
 *  first revision of this recorded [map[first], map[last] + 1], the outer hull,
 *  and an independent review broke it in one line: in a tag-dropping view that
 *  hull swallows every byte the view removed, so
 *
 *      <p>no surge <img alt="no surge, ever" /> today</p>
 *
 *  read as "no surge today" under `tags-removed`, and the hull it spanned covered
 *  the alt attribute — withdrawing a never-claimed §5 string that a browser puts
 *  on screen. It passed both gates green. A hull is a claim about the ENDS of a
 *  match; what a withdrawal needs is the match's own bytes. */
export function permissionsIn(views, patterns) {
  const out = new Map();
  for (const { text, map, fabricates } of views) {
    if (fabricates) continue;
    for (const [at, { permits }] of patterns.entries()) {
      if (!permits) continue;
      for (const m of text.matchAll(globalise(permits))) {
        if (!m[0].length) continue;
        const offsets = new Set(map.slice(m.index, m.index + m[0].length));
        const permitted = out.get(at) ?? [];
        permitted.push(offsets);
        out.set(at, permitted);
      }
    }
  }
  return out;
}

/** Whether an accusation is covered by its own pattern's permitted phrase — every
 *  byte the accusation was READ FROM being a byte that phrase was read from too.
 *
 *  Containment, not overlap, and offsets rather than a range on either side. Both
 *  sides drop bytes: the accusation may come from a view that removed a tag from
 *  the middle of the claim ("No <b>surge</b> today"), and the permission from a
 *  different view that removed a different one. Comparing outer ranges gets both
 *  directions wrong — it excuses claims hiding in the gaps of the permitted
 *  phrase, and it accuses a permitted phrase that has a gap of its own. */
export function isPermitted(permissions, at, offsets) {
  const permitted = permissions.get(at);
  return !!permitted && permitted.some((allowed) => offsets.every((o) => allowed.has(o)));
}

/** Every match of `patterns` in every view, as
 *  [{ at, text, view, span: [startOffset, endOffset), offsets }] in original-byte
 *  coordinates. Both gates match the same way; they differ only in what they do
 *  with the results afterwards.
 *
 *  `span` is the outer hull — what counting occurrences and reporting a line range
 *  want. `offsets` is the bytes the match was actually read from, which in a
 *  tag-dropping view is a SUBSET of that hull; isPermitted wants those, because a
 *  hull tells you where a match ended and not what it was made of. */
export function matchesIn(views, patterns) {
  const out = [];
  for (const { name, text, map } of views) {
    for (const [at, { re }] of patterns.entries()) {
      for (const m of text.matchAll(globalise(re))) {
        if (!m[0].length) continue;
        const offsets = map.slice(m.index, m.index + m[0].length);
        out.push({
          at,
          text: m[0].toLowerCase(),
          view: name,
          span: [offsets[0], offsets[offsets.length - 1] + 1],
          offsets,
        });
      }
    }
  }
  return out;
}
