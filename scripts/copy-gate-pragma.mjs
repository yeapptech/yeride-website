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
// is what the ticket proposed — reuse stripComments, the comment model the gate
// already has. ONE thing rules that out, and it is not the one the first draft of
// this comment gave: stripComments does not touch "<!-- -->" at all, on purpose,
// because Astro emits HTML comments into the built page and they ship. But
// "<!--" is the only comment syntax valid in .astro markup, which is exactly
// where the gate's normalised pass reports, so it MUST stay a legal pragma site,
// and a model that blanks it nowhere can never say a pragma sits inside it.
//
// The first draft also argued that stripComments blanks only LINE-LEADING
// comments, so reusing it would reject every trailing "foo, // copy-gate-allow:
// ...". True, and NOT a reason to prefer this rule — a review caught it — because
// anchoring rejects the trailing form too. Losing it is a deliberate cost of
// #100, not an advantage over the alternative: an inline pragma is exactly the
// shape whose introducing "//" is hardest to tell from shipped text, which is
// the whole defect. Nothing in this repo used it, and the gate's failure footer
// no longer advertises it.
//
// Anchoring also costs nothing real elsewhere: all eleven live pragmas in
// feesCopy.ts, legalCopy.ts and FeeSchedule.astro already open their own
// line-leading "//".
//
// WHAT THIS BUYS. To authorise itself now, shipped copy has to begin a line with
// a comment opener and put the pragma first on it. A URL cannot do that; a
// sentence cannot do that. The residue is a line of shipped markup whose text
// starts with "*" or "<!--" — and a line-leading "<!--" in markup IS an HTML
// comment, while a line of body copy beginning with a bare "*" authorises only
// the line below it. Both are deliberate authoring, not a link pasted into an
// attribute, and the dist gate remains the backstop for deliberate authoring.
//
// STILL NO ESCAPE HATCH under public/ for a file type with no comment syntax.
// #100 looked at inventing one and deliberately did not; the case is argued
// where #81 left it, in check-copy-gate.mjs's header, and is not restated here.
// The one line of it that belongs to this module: the only pragma such a file
// could carry would sit inside a shipped string value, which is precisely the
// self-authorisation the rule above refuses.

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
