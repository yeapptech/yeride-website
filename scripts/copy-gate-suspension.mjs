// The reader behind check-copy-gate.mjs's copy-map §3.4 suspension rule, in a
// module of its own so it can be PROVED to fire — see
// scripts/copy-gate-suspension.test.mjs. Wayfinder #83.
//
// #83's finding: the rule was written as /family:\s*"passthrough"/, which
// enforces §3.4 against one of the three ways to write a string literal in
// JavaScript. This repo has no linter and no Prettier config, so nothing
// normalises quote style: a charge filed as `family: 'passthrough'` shipped
// §3.4's suspended family-2 heading, lead and insurance note on /fees — copy
// claiming YeRide passes costs through at cost and carries insurance, neither
// of which is true — off a green build, with every copy-gate-allow pragma still
// blessed. That is the exact outcome the rule exists to make impossible.
//
// Reading the SOURCE rather than importing the value is forced, not preferred:
// these gates run in checks.yml, which is dependency-free by design, and
// importing a .ts module would need a compiler. scripts/check-fee-labels.mjs
// reads the same file the same way and for the same reason, and its key regex
// has always accepted both quote styles — this brings the suspension rule up to
// the reader the repo already had.
//
// What reading source buys instead of an import is bought back by failing
// CLOSED: a rename or a delete of the map is an ERROR naming the cause, never a
// silent pass. The failure an import would have caught loudly is caught loudly.
//
// KNOWN RESIDUAL: an invisible character between `family`, the colon and the
// quote still passes, as does a value assembled from a constant. Both are
// evasion rather than accident — the accident this closes is quote style — and
// the invisible-character class is a stated limit of the copy gate as a whole
// (see CLAUDE.md). A curly quote is not in that class: it does not compile, so
// `astro check` fails the build before this rule is asked.

/** A charge filed into the pass-through family, in any of the three string
 *  literal syntaxes. The backreference is what makes it quote-agnostic without
 *  also matching `family: "tech"` closed by a different quote. */
export const PASSTHROUGH_FILED = /family\s*:\s*(["'`])passthrough\1/;

/**
 * Read whether a charge is filed into the pass-through family.
 *
 * @param source comment-stripped text of src/i18n/feeLabels.ts, or `null` when
 *   the file is absent — the caller reads the file, this decides what it means.
 * @returns `{readable: false, why}` when the question cannot be answered, so
 *   the caller can fail rather than treat "could not tell" as "not filed".
 */
export function passthroughFiling(source) {
  if (source == null) {
    return { readable: false, why: "the file is missing or has been renamed" };
  }
  if (!/export\s+const\s+feeLabels\b/.test(source)) {
    return {
      readable: false,
      why: 'it has no "export const feeLabels" — has the charge map been renamed?',
    };
  }
  return { readable: true, filed: PASSTHROUGH_FILED.test(source) };
}
