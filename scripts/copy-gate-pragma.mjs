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

// ONE RULE, TWO TOKENS (#88). check-astro-prose.mjs needs the same hatch
// discipline, so it takes the same reader through the factory below rather than
// re-typing the position rule — a rule present in one gate and spelled again in
// the other reads as agreement when it is not, which is #57's argument for one
// pattern list and #68's for one normaliser, and #100 found that drift living
// inside a SINGLE gate.
//
// The TOKEN has to differ, and that is forced rather than chosen:
// check-copy-gate.mjs scans .astro files too, and it fails the build on a
// `copy-gate-allow` that matches nothing. A prose hatch spelled with that token
// would be read by both gates, satisfy one and be reported as dead by the other.
// So the prose gate's token is `astro-prose-allow`, and neither gate can see the
// other's pragmas.

/**
 * Build a pragma reader for one token.
 *
 * Both regexes are built per token rather than shared, because a pragma reader
 * carries no state between calls and building two of them costs nothing.
 *
 * MENTIONS is a pragma named anywhere on the line. It is used only to tell "you
 * wrote one in the wrong place" from "there is no pragma here" — a misplaced
 * pragma has to be an error, never a silent no-op, or the author believes they
 * are covered.
 *
 * OPENS_COMMENT is a pragma that OPENS its comment: line start, an optional "{"
 * for the .astro expression-wrapped block-comment form, a comment opener,
 * whitespace, then the pragma. The reason runs to end of line and is trimmed of
 * its own closing delimiter by the caller.
 *
 * The openers are written "one or more" rather than exact so that "///", a
 * "/**" JSDoc opener and a "**" continuation are pragma sites too — each is the
 * same comment, differing only in how many stars its author typed.
 *
 * @param token the pragma word, without its colon. Written literally into both
 *   patterns, so it must contain no regex metacharacter; the two live tokens are
 *   `copy-gate-allow` and `astro-prose-allow`.
 * @returns a reader with the signature described on `readPragma` below.
 */
export function pragmaReader(token) {
  const mentions = new RegExp(`${token}:`);
  const opensComment = new RegExp(
    `^[ \\t]*(?:\\{[ \\t]*)?(?:\\/\\/+|\\/\\*+|<!--+|\\*+)[ \\t]*${token}:[ \\t]*(.+?)[ \\t]*$`,
  );
  return (line) => {
    const opens = line.match(opensComment);
    if (opens) return { reason: opens[1] };
    return mentions.test(line) ? { misplaced: true } : null;
  };
}

/**
 * Read one source line as a `copy-gate-allow` pragma.
 *
 * @param line one raw line of a scanned file.
 * @returns `null` when the line does not mention a pragma at all;
 *   `{misplaced: true}` when it mentions one that does not open a comment — the
 *   caller must report this, since the author intended coverage and has none;
 *   `{reason}` otherwise, with the reason still carrying any trailing comment
 *   delimiter for the caller to strip.
 */
export const readPragma = pragmaReader("copy-gate-allow");

// ---------------------------------------------------------------------------
// THE ALLOWLIST DISCIPLINE ITSELF, and not just the position rule.
//
// #88 added a second gate with a second hatch, and its first revision re-typed
// all of this: the ticket rule, the line pairing and the unused sweep. A review
// called that what it is — the repo's own "never two of any" doctrine (#57 for
// one pattern list, #68 for one normaliser, #81 for one file-type table), which
// exists because a rule present in one gate and subtly different in the other
// reads as agreement when it is not. A hatch is the one mechanism whose job is
// to make a build say LESS, so of everything in these gates it is the worst
// thing to hold two copies of: the drift would show up as a gate that quietly
// blesses what its twin refuses.
//
// So the three rules live here once and both gates call them. What stays with
// each gate is only its own WORDING — the token differs, so the error text must.

/** "#48ff00" is a colour, not a ticket. */
export const TICKET = /#\d+(?!\w)/;

/**
 * Read every pragma in a file.
 *
 * @param source the whole file.
 * @param file the path, recorded on each pragma so one flat list can serve a
 *   whole run.
 * @param read a reader from `pragmaReader`.
 * @returns `{pragmas, misplaced}` — `misplaced` is the lines that named a pragma
 *   without opening a comment. Those are returned rather than thrown because
 *   each gate words that error in its own token, but they must never be dropped:
 *   an author who wrote one believes they are covered.
 */
export function collectPragmas(source, file, read) {
  const pragmas = [];
  const misplaced = [];
  source.split(/\r?\n/).forEach((line, i) => {
    const hit = read(line);
    if (!hit) return;
    if (hit.misplaced) {
      misplaced.push({ file, line: i + 1 });
      return;
    }
    pragmas.push({
      file,
      line: i + 1,
      // An HTML pragma would otherwise print its own closing delimiter as part
      // of the reason.
      reason: hit.reason.replace(/\s*(-->|\*\/|\})+$/, ""),
      used: false,
    });
  });
  return { pragmas, misplaced };
}

/**
 * The pragma covering a hit on `line` of `file`, if any.
 *
 * A pragma covers the line a match STARTS on, or the line directly above it. It
 * has to be the start rather than any line in the span, because the alternative
 * is the laundering shape an earlier review closed: a pragma further down
 * authorising a claim whose reader, looking at the line it begins on, sees no
 * pragma at all. Since #100 every pragma opens its own comment, so there is no
 * longer a "covers next" distinction — every pragma covers both.
 */
export function pragmaFor(pragmas, file, line) {
  return (
    pragmas.find((p) => p.file === file && p.line === line) ??
    pragmas.find((p) => p.file === file && p.line === line - 1)
  );
}

/** The pragmas nothing matched, so an allowlist cannot outlive its reason. */
export function unusedPragmas(pragmas) {
  return pragmas.filter((p) => !p.used);
}
