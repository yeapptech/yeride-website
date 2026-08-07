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

import { matchesIn, viewsOf } from "./copy-gate-normalise.mjs";
import { PATTERNS } from "./copy-gate-patterns.mjs";

// The source gate's reading — the non-fabricating views. Deliberately not the
// dist gate's: a control that passes only under a view documented as able to
// invent phrases proves nothing about what the source gate sees.
const fires = (raw, markup = true) =>
  matchesIn(viewsOf(raw, { markup, includeFabricating: false }), PATTERNS).length > 0;

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
];

// ---------------------------------------------------------------------------

let failures = 0;

const check = (label, cases, want) => {
  for (const [name, raw] of cases) {
    const got = fires(raw);
    if (got === want) continue;
    failures++;
    console.error(`  ✗ ${label}: ${name}`);
    console.error(`      ${JSON.stringify(raw)}`);
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
for (const [name, raw] of [...MUST_FIRE, ...MUST_NOT_FIRE]) {
  for (const view of viewsOf(raw, { markup: true, includeFabricating: true })) {
    if (view.map.length !== view.text.length) {
      failures++;
      console.error(`  ✗ span map: ${name} [${view.name}] — ${view.map.length} offsets for ${view.text.length} characters`);
    }
    for (const offset of view.map) {
      if (!Number.isInteger(offset) || offset < 0 || offset >= raw.length) {
        failures++;
        console.error(`  ✗ span map: ${name} [${view.name}] — offset ${offset} is outside the source`);
        break;
      }
    }
  }
}

if (failures) {
  console.error(`\n✗ copy-gate normaliser: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`✓ copy-gate normaliser (${MUST_FIRE.length + MUST_NOT_FIRE.length} controls)`);
