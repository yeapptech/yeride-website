// Controls for the copy-gate normaliser. Plain Node, no deps, run by hand:
//
//     node scripts/copy-gate-normalise.test.mjs
//
// The sibling of scripts/copy-gate-patterns.test.mjs and for the same reason.
// Wayfinder #80 found three of this normaliser's tables were the EXAMPLES of a
// class rather than the class — eight invisible code points out of 4,206, numeric
// references bounded and semicolon-required where HTML5 is neither, and a
// confusable check that read raw lines while the machinery beside it decoded one
// and threw it away. None of that was visible from a green build, and the only
// thing that would have shown it is a list like this one.
//
// So the SECOND list is the valuable half, exactly as it is over there: every
// "must stay quiet" case is either a phrase no reader sees (a fabrication) or
// real copy from this site. Widening a table is easy and widening it too far is
// easier, and the cost of over-reach here is a build that fails on text nobody
// wrote.
//
// Every invisible character is written as an ESCAPE, never as itself — the same
// rule copy-gate-normalise.mjs follows, and for the same reason: a literal would
// make this file unreviewable and one byte lost in an editor would quietly turn a
// control into a tautology.

import { fileURLToPath } from "node:url";
import { reported, runGate } from "./copy-gate-fixture.mjs";
import { matchesIn, viewsOf } from "./copy-gate-normalise.mjs";
import { PATTERNS } from "./copy-gate-patterns.mjs";

const DIST_GATE = fileURLToPath(new URL("./check-dist-copy-gate.mjs", import.meta.url));

// The source gate's reading — the non-fabricating views. Deliberately not the
// dist gate's: a control that passes only under a view documented as able to
// invent phrases proves nothing about what the source gate sees.
const fires = (raw) =>
  matchesIn(viewsOf(raw, { markup: true, includeFabricating: false }), PATTERNS).length > 0;

/** A word split at the "|" by one invisible character, named by code point.
 *
 *  BUILT rather than typed, and this is stronger than the escape rule the header
 *  states. An escape is not enough on its own: several editors and more than one
 *  agent tool rewrite a backslash-u escape into the character it denotes on save,
 *  which turns a control into an unreadable byte nobody can review — and, when the
 *  byte is lost instead, into a test that passes because it no longer tests
 *  anything. A number survives both, and this file was written twice before that
 *  was true. */
const split = (text, codePoint) => `<p>${text.replace("|", String.fromCodePoint(codePoint))}</p>`;

// ---------------------------------------------------------------------------
// MUST FIRE. Each of these renders as a forbidden §5 claim in a browser. Every
// entry below the divider is one #80 measured passing both gates green.

const MUST_FIRE = [
  // #68's cases, kept as regressions.
  ["tag boundary with text either side", "Flat fees, <strong>no</strong> surprises."],
  ["nbsp entity", "<p>Everything at&nbsp;cost.</p>"],
  ["phrase wrapped across one newline", "<p>Everything at\ncost.</p>"],
  ["zero-width space, an original member", split("insur|ance", 0x200b)],

  // ---- #80 ----
  // Invisible characters outside the old eight-member set.
  ["variation selector U+FE0F", split("Full insur|ance included.", 0xfe0f)],
  ["bidi embedding U+202A", split("insur|ance", 0x202a)],
  ["bidi isolate U+2066", split("insur|ance", 0x2066)],
  ["combining grapheme joiner U+034F", split("insur|ance", 0x034f)],
  ["invisible times U+2062", split("insur|ance", 0x2062)],
  // Astral, so one code point is two UTF-16 units — the case that forced the
  // normaliser to iterate by code point rather than by unit.
  ["tag character U+E0041", split("insur|ance", 0xe0041)],
  // Numeric references HTML5 accepts and the old bounded regex did not.
  ["decimal with leading zeros", "<p>&#00000105;nsurance</p>"],
  ["hex with leading zeros", "<p>&#x0000069;nsurance</p>"],
  ["decimal without the semicolon", "<p>&#105nsurance</p>"],
  ["hex without the semicolon", "<p>&#x69nsurance</p>"],
  // A legacy named reference without its semicolon, which browsers decode.
  ["&nbsp without the semicolon", "<p>Everything at&nbspcost.</p>"],
  ["&shy without the semicolon", "<p>insur&shyance</p>"],

  // ---- #99 ----
  // A claim behind a JavaScript comparison. Before #99 the "<" of "r<t.length"
  // opened a span that ran to the next ">", swallowing the claim whole — and the
  // plain view does not rescue it, because there the claim is still split by its
  // own tag. Both were run against the pre-#99 normaliser first: both returned NO
  // hits under either gate's view set, which is what makes them controls rather
  // than decoration. The two differ in which part of the old scan carried the span
  // past the claim — a quoted attribute value in the first, a brace in the second.
  [
    "claim swallowed behind a minified comparison",
    'x<t.length&&(n.innerHTML="Full insur<b>ance</b> included.");y=a>b;',
  ],
  [
    "claim swallowed behind a comparison inside a block",
    "if(r<t.length){o.innerHTML='We carry insur<span>ance</span> on every ride.'}m=p>q;",
  ],

  // The other side of #99's narrowing, and the more important list of the two:
  // every tag shape this repo's own output actually contains must still be read as
  // a tag. A real tag the opening test declined would be a MISS — the quiet
  // direction — so these are the controls that keep the tightening honest. Each is
  // the same §5 word split by one tag shape; each fails if TAG_OPEN's name charset
  // or its terminator set is narrowed further.
  ["split by a self-closing tag", "<p>insur<br/>ance</p>"],
  ["split by an Astro namespaced component", "<p>insur<Foo.Bar />ance</p>"],
  ["split by an XML-namespaced tag", "<p>insur<svg:text />ance</p>"],
  ["split by a hyphenated custom element", "<p>insur<my-el></my-el>ance</p>"],
  ["split by an attribute-heavy tag", "<p>insur<span class=\"a\" data-x='b' hidden>ance</span></p>"],
  ["split by a tag whose attribute is on the next line", '<p>insur<span\n  class="x">ance</span></p>'],
  ["split by an HTML comment", "<p>insur<!-- see /fees -->ance</p>"],
  ["split by a CDATA section", "<p>insur<![CDATA[x]]>ance</p>"],
  ["a doctype does not stop the page being read", "<!doctype html><p>Flat insur<b>ance</b>.</p>"],
];

// ---------------------------------------------------------------------------
// MUST STAY QUIET. A hit here is a phrase nobody ships.

const MUST_NOT_FIRE = [
  // Real copy from this site, quoted in copy-gate-patterns.mjs as the strings the
  // word gaps were measured against.
  ["shipped EN home meta", "<p>flat published fees, and a rate card anyone can read</p>"],
  ["canonical EN driver pillar", "<p>Flat, published tech fees — never a percentage of the fare</p>"],
  ["ES availability line", "<p>Tarifas en la única zona donde operamos.</p>"],

  // Fabrications the normaliser's own rules exist to refuse.
  ["paragraph break is not a word space", "Everything is at\n\ncost of nothing."],
  ["inter-element whitespace", "<td>no</td>\n<td>surprises</td>"],

  // #80's own additions must not weld. A reference a browser renders as U+FFFD,
  // or leaves as literal text, keeps the two halves apart.
  ["out-of-range numeric reference", "<p>insur&#99999999;ance</p>"],
  ["lone surrogate reference", "<p>insur&#xD800;ance</p>"],
  ["null reference", "<p>insur&#0;ance</p>"],
  ["non-legacy name without a semicolon", "<p>insur&mdashance</p>"],
  ["unknown name without a semicolon", "<p>insur&fooance</p>"],
  ["a bare ampersand is text", "<p>insur&ance</p>"],
  // The reason NAMED_LEGACY is a list and not "all of NAMED": a query string.
  ["query string in an href", '<a href="/fees?a=1&region=south">rate card</a>'],

  // ---- #99, the welding direction ----
  // The mirror of the two swallowed-claim cases above, and the louder half: a span
  // that runs from a "<" operator to a distant ">" and is then DELETED joins the
  // identifiers either side into a phrase nobody wrote. Both fired on the pre-#99
  // normaliser — "rates,n=id,flat" and "rates=rb,flat", §5 hits on minified
  // JavaScript — so both are controls that could fail. The mitigation the dist gate
  // offers elsewhere is weakest here: an ALLOWED entry is keyed to the matched text
  // and an exact count, and that text is minifier output, so it changes on the next
  // dependency bump and re-fails the deploy.
  ["minified comparison welding a noun to an adjective", "let e=o.rates,n=i<t.length&&x(1)?a:b,q=c>d,flat=1;"],
  ["the same weld in a const declaration", "const rates=r<t.n?u:v,z=a>b,flat=2;"],
  // Straight from the real bundles: escapeHtml's own regex literal, which the old
  // opening test read as a closing tag named "g".
  ["a JavaScript regex literal is not a tag", 'return s.replace(/</g,"&lt;").replace(/>/g,"&gt;");'],
  // "a<!b" is ordinary JavaScript — a comparison against a negation — and this is
  // the control that earns the second of TAG_OPEN's two narrowings. Accepting any
  // "<!x" the way HTML5's bogus-comment rule does welds here; accepting only the
  // three bang forms that occur in real markup does not. Checked against a
  // deliberately widened copy first, where it fabricates "rates,n=id,flat".
  ["a negation is not a bang form", "let e=o.rates,n=i<!x&&y?a:b,q=c>d,flat=1;"],
];

// ---------------------------------------------------------------------------

let failures = 0;

const check = (label, cases, want) => {
  for (const [name, raw] of cases) {
    if (fires(raw) === want) continue;
    console.log(`FAIL  ${label} — ${want ? "nothing matched" : "false positive"}: ${name}`);
    console.log(`      ${JSON.stringify(raw)}`);
    failures++;
  }
};

check("should fire", MUST_FIRE, true);
check("should stay quiet", MUST_NOT_FIRE, false);

// Every match is reported as a span of ORIGINAL bytes, and both gates depend on
// that: the source gate turns a span into a line number and the dist gate counts
// occurrences by overlap. A view that emits a character without recording where it
// came from slides every span after it, which is silent — the gate keeps working
// and points at the wrong line. Astral characters are where that breaks, because
// one code point is two UTF-16 units.
let spanChecks = 0;
for (const [name, raw] of [...MUST_FIRE, ...MUST_NOT_FIRE]) {
  for (const view of viewsOf(raw, { markup: true, includeFabricating: true })) {
    spanChecks++;
    if (view.map.length !== view.text.length) {
      console.log(`FAIL  span map — ${name} [${view.name}]`);
      console.log(`      ${view.map.length} offsets for ${view.text.length} characters`);
      failures++;
    }
    for (const offset of view.map) {
      if (!Number.isInteger(offset) || offset < 0 || offset >= raw.length) {
        console.log(`FAIL  span map — ${name} [${view.name}]: offset ${offset} is outside the source`);
        failures++;
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// #99 END-TO-END. Everything above reads the normaliser directly, and #83's
// review is the reason that is not enough on its own: the reader being right is
// not the claim. Between viewsOf and a deploy failing sit the file walk, the view
// selection and the ALLOWED list. These two spawn the real dist gate over a
// throwaway tree — one bundle per direction, the same two shapes as above.
let e2e = 0;
{
  const file = "dist/_astro/Chunk.abcd1234.js";
  const { out } = runGate(DIST_GATE, {
    [file]: 'x<t.length&&(n.innerHTML="Full insur<b>ance</b> included.");y=a>b;',
  });
  e2e++;
  // The gate reports the HASH-FREE path, which is what its ALLOWED list is keyed
  // to, so that is what the assertion names.
  if (!reported(out, "_astro/Chunk.js", "insurance")) {
    console.log("FAIL  dist gate must report a claim swallowed behind a comparison");
    console.log(`      ${out.trim()}`);
    failures++;
  }
}
{
  const file = "dist/_astro/Vendor.abcd1234.js";
  const { out } = runGate(DIST_GATE, {
    [file]: "let e=o.rates,n=i<t.length&&x(1)?a:b,q=c>d,flat=1;",
  });
  e2e++;
  // Any §5 hit at all, not one phrase: the weld's matched text is whatever the
  // views join, and pinning it here would pass the day a DIFFERENT phantom
  // replaced it.
  if (/^\s*_astro\/Vendor\.js {2}"/m.test(out)) {
    console.log("FAIL  dist gate must report nothing for a minified comparison");
    console.log(`      ${out.trim()}`);
    failures++;
  }
}

// Every list this file runs, the span-map sweep included — the sibling counts
// PATHOLOGICAL the same way. A total that omits a check can only shrink when that
// check is deleted, which is the one moment it needed to be loud.
const total = MUST_FIRE.length + MUST_NOT_FIRE.length + spanChecks + e2e;
console.log(`${failures ? "✗" : "✓"} copy-gate normaliser: ${total} controls, ${failures} failure${failures === 1 ? "" : "s"}`);
process.exit(failures ? 1 : 0);
