// The reader behind check-copy-gate.mjs's `copy-gate-allow` pragma, in a module
// of its own so it can be PROVED to refuse what it claims to refuse — see
// scripts/copy-gate-pragma.test.mjs. Wayfinder #100.
//
// #100's finding: the rule was written as "does a comment opener appear
// ANYWHERE earlier on this line", /(\/\/|\/\*|<!--|^[ \t]*\*)/ against the text
// before the pragma. A URL contains "//". So the one thing the rule's own
// comment said it prevented — shipped markup authorising its own forbidden
// claim — was not prevented:
//
//     <p data-src="https://x.test/a">Rides at cost. copy-gate-allow: ok #99</p>
//
// passed the gate, and printed itself as an allowance. That was executed, not
// read. The dist gate still caught that particular line, because source pragmas
// are stripped by the build and never reach it, which is what made this a
// defence-in-depth failure rather than a live hole: the layer that fails at
// authorship time, with a file and a line, could be talked out of it by a link.
//
// THE RULE NOW: a pragma must OPEN its comment. The line begins with a comment
// opener, and between that opener and "copy-gate-allow:" there is nothing but
// whitespace. Position, not presence.
//
// Why anchoring rather than a real "is this offset inside a comment" test, which
// is what the ticket first proposed. The gate already has a comment model —
// stripComments — but it is deliberately NOT the same question, and reusing its
// answer would have been wrong in both directions:
//   - stripComments blanks only LINE-LEADING "//" and block comments, because a
//     mid-line "//" is far more likely to be shipped text. So a trailing
//     "foo, // copy-gate-allow: ..." sits OUTSIDE every region it blanks, and
//     every inline pragma would have been rejected.
//   - stripComments does not touch "<!-- -->" at all, on purpose: Astro emits
//     HTML comments into the built page, so they ship. But "<!--" is the only
//     comment syntax valid in .astro markup, which is exactly where the gate's
//     normalised pass reports, so it MUST be a legal pragma site.
// Anchoring answers both without a second comment model to drift against the
// first. It also costs nothing real: all twelve live pragmas in feesCopy.ts,
// legalCopy.ts and FeeSchedule.astro already open their own line-leading "//".
//
// WHAT THIS BUYS. To authorise itself now, shipped copy has to begin a line with
// a comment opener and put the pragma first on it. A URL cannot do that; a
// sentence cannot do that. The residue is a line of shipped markup whose text
// starts with "*" or "<!--" — and a line-leading "<!--" in markup IS an HTML
// comment, while a line of body copy beginning with a bare "*" authorises only
// the line below it. Both are deliberate authoring, not a link pasted into an
// attribute, and the dist gate remains the backstop for deliberate authoring.
//
// STILL NO ESCAPE HATCH under public/ for a file type with no comment syntax —
// .json, .webmanifest, which #81 made readable as markup because they ship byte
// for byte. #100 looked at inventing one and deliberately did not: nothing under
// public/ is a .json today, so there is no case to design against, and the only
// pragma such a file could carry would sit inside a shipped string value, which
// is precisely the self-authorisation this module exists to refuse. Reword the
// copy, or move the file's text into a .astro component. When a real case
// arrives, decide then.

/** A pragma MENTIONED anywhere on the line. Used only to tell "you wrote one in
 *  the wrong place" from "there is no pragma here" — a misplaced pragma has to
 *  be an error, never a silent no-op, or the author believes they are covered. */
const MENTIONS = /copy-gate-allow:/;

// A pragma that OPENS its comment: line start, an optional "{" for the .astro
// expression-wrapped block-comment form, a comment opener, whitespace, then the
// pragma. The reason runs to end of line and is trimmed of its own closing
// delimiter by the caller.
//
// The openers are written "one or more" rather than exact so that "///", a
// "/**" JSDoc opener and a "**" continuation are pragma sites too — each is the
// same comment, differing only in how many stars its author typed.
const OPENS_COMMENT = /^[ \t]*(?:\{[ \t]*)?(?:\/\/+|\/\*+|<!--+|\*+)[ \t]*copy-gate-allow:[ \t]*(.+?)[ \t]*$/;

/**
 * Read one source line as a pragma.
 *
 * @param line one raw line of a scanned file.
 * @returns `null` when the line does not mention a pragma at all;
 *   `{misplaced: true}` when it mentions one that does not open a comment — the
 *   caller must report this, since the author intended coverage and has none;
 *   `{reason}` otherwise, with the reason still carrying any trailing comment
 *   delimiter for the caller to strip.
 */
export function readPragma(line) {
  const opens = line.match(OPENS_COMMENT);
  if (opens) return { reason: opens[1] };
  return MENTIONS.test(line) ? { misplaced: true } : null;
}
