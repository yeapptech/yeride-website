// The reader behind check-astro-prose.mjs — finds the TEXT NODES of an .astro
// template and decides which of them are prose. Wayfinder #88; the rule, its
// boundary and its escape hatch were decided by #79, which is worth reading
// before changing any of this.
//
// In a module of its own for the reason copy-gate-pragma.mjs is: the gate calls
// this, so "the reader is right" is not evidence that the gate fails the build,
// and both layers are proved separately in scripts/astro-prose.test.mjs.
//
// THE RULE. A text node in an .astro template must not contain prose. Rendered
// body copy comes from src/i18n/. Literal prose in markup fails the build.
//
// THE BOUNDARY IS TEXT NODES, AND THAT IS A DECISION, NOT AN OMISSION.
// Attributes and props are out of scope — alt, aria-label, placeholder, and
// above all title and description, which every one of the page files passes to
// BaseLayout as a literal. That is not drift: #37's review DELETED twelve
// title/description keys from src/i18n precisely because they duplicated the
// page files, so a rule covering attributes would reverse a decision already
// taken on evidence. A text node is also what a reader sees on the page, which
// is the surface copy-map §5's gate already protects, so the two rules police
// one thing rather than two.
//
// WHAT COUNTS AS PROSE — the whole rule, and a boundary drawn wrong produces the
// cry-wolf failure #68 refused. #88 named two candidates and left the choice to
// be made against the real tree rather than in advance. Measured over all 35
// .astro files: 11 non-blank text nodes, of which ten are a "→" glyph or a bare
// ":" and one is Footer.astro's copyright.
//
//   A. two or more whitespace-separated word characters  — fires on the
//      copyright, zero false positives over the corpus.
//   B. a space between two LETTERS                       — does NOT fire on
//      "© 2026 YeRide", because "2026" is digits.
//
// So B, written as #88 worded it, would have shipped a rule that fails to catch
// the single piece of prose in the tree and fails to force the one cleanup the
// ticket names. A is the rule. That is a measurement deciding it, which is the
// method #75 used and the reason the choice was deferred to here.
//
// WHAT IT DOES NOT COVER — stated, not left to be found:
//
//   - {"About YeRide"} in markup. A text-node rule is evaded by moving the
//     string into an expression, and this one deliberately does not read inside
//     one. The threat model is the ACCIDENT — a hurried page, a hand-edited
//     clause — not the evasion, and §5's gate still meets a forbidden claim on
//     the way out. Naming the limit is the point: the unstated limit is what
//     #57, #59 and #65 were re-opened over, not the limit itself.
//   - .md/.mdx. There are none under src/ and no MDX integration. Adding one
//     reopens this.
//   - a one-letter tag name. "{a <b ? x : y}" opens a span here exactly as it
//     does for the copy gate's tag views, and for the same reason: no syntactic
//     rule separates "<b" the tag from "<b" the comparison. #99 argues it at
//     length in copy-gate-normalise.mjs. The residue here is milder than there —
//     a swallowed span can only make this gate read LESS text, so it can hide a
//     text node but never invent one, and a hidden text node is a miss rather
//     than a false failure.

import { opensTag, tagEnd } from "./copy-gate-normalise.mjs";

/** The offset where the template starts — just past the frontmatter fence, or 0
 *  when there is none. Only a LEADING fence counts; a "---" in the body is an
 *  <hr> in Markdown and ordinary text here. */
export function templateStart(source) {
  if (!/^---\r?\n/.test(source)) return 0;
  const fence = source.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/);
  return fence ? fence[0].length : 0;
}

/** A tag that opens an element whose CONTENT IS NOT MARKUP. Its body has to be
 *  skipped wholesale — a <script> is JavaScript and a <style> is CSS, and
 *  reading either as template text reports every string literal in the bundled
 *  form logic as prose. */
const RAW_ELEMENT = /^<[ \t]*(script|style)\b/i;
const SELF_CLOSING = /\/[ \t]*>$/;

/**
 * Every non-blank text node in an .astro template.
 *
 * NOT A PARSER, and it does not need to be — it is `opensTag`/`tagEnd` run for
 * their COMPLEMENT, the spans between one tag's end and the next tag's start.
 * Those two are imported rather than rewritten (#57's argument for one pattern
 * list, #68's for one normaliser), and they already refuse the three fabrications
 * a naive indexOf(">") produces.
 *
 * MARKUP AND EXPRESSIONS INTERLEAVE, which is the one thing this has to get
 * right and the reason it is not simply "skip from { to }". Most of this site's
 * markup is built INSIDE an expression — LegalDocument, BaseLayout, AboutPage and
 * PreRegistrationForm all render through `.map(… => (<li>…</li>))` — so a reader
 * that skipped expression bodies would leave the main surface unscanned while
 * appearing to cover it. Instead a single `inMarkup` flag follows the nesting:
 * a tag always returns us to markup, "{" leaves it, and the "}" closing that
 * expression returns to the markup that contained it.
 *
 * Inside an expression, quotes and template literals are tracked, so a "}" in a
 * string ({cond ? "a}" : "b"}) cannot close the expression early and spill the
 * remaining JavaScript out as a text node.
 *
 * @param source the whole .astro file, frontmatter included.
 * @returns `{at, text}` per node, `at` being the offset in `source` of its first
 *   character — so the caller reports the line an author has to edit.
 */
export function textNodes(source) {
  const nodes = [];
  let i = templateStart(source);
  let inMarkup = true;
  let depth = 0;
  let quote = "";
  let buffer = "";
  let at = i;

  const flush = () => {
    if (buffer.trim()) nodes.push({ at, text: buffer });
    buffer = "";
  };

  while (i < source.length) {
    const ch = source[i];

    // Inside a string in an expression nothing is markup, not even a "<".
    if (quote) {
      if (ch === "\\") i += 2;
      else {
        if (ch === quote) quote = "";
        i++;
      }
      continue;
    }

    if (opensTag(source, i)) {
      const end = tagEnd(source, i);
      // An unterminated tag closes nothing. Treat the "<" as the ordinary text
      // a browser would, rather than swallowing the rest of the file.
      if (end === -1) {
        if (inMarkup) {
          if (!buffer) at = i;
          buffer += ch;
        }
        i++;
        continue;
      }
      flush();
      const tag = source.slice(i, end);
      i = end;
      const raw = tag.match(RAW_ELEMENT);
      if (raw && !SELF_CLOSING.test(tag)) {
        const rest = source.slice(i);
        const close = rest.match(new RegExp(`</[ \\t]*${raw[1]}[ \\t]*>`, "i"));
        i += close ? close.index + close[0].length : rest.length;
      }
      inMarkup = true;
      at = i;
      continue;
    }

    if (ch === "{") {
      flush();
      depth++;
      inMarkup = false;
      i++;
      at = i;
      continue;
    }

    if (ch === "}") {
      // Whatever was accumulating belonged to the expression, not to the page.
      buffer = "";
      if (depth > 0) depth--;
      inMarkup = true;
      i++;
      at = i;
      continue;
    }

    // A COMMENT INSIDE AN EXPRESSION, before quotes are looked at — and this is
    // load-bearing rather than tidy. FeeSchedule.astro carries
    //
    //     {/* Stripe's fee is not a YeRide charge … */}
    //
    // and an apostrophe in ordinary English opens a string that never closes.
    // Without this branch the walk was still inside that string 40 lines later,
    // read straight past <script>, and reported the whole bundled form logic as
    // prose — 49 findings, every one of them false. A gate that cries wolf on
    // its first run is the failure #68 refused, and this is exactly how it
    // happens.
    if (!inMarkup && ch === "/" && (source[i + 1] === "*" || source[i + 1] === "/")) {
      if (source[i + 1] === "*") {
        const end = source.indexOf("*/", i + 2);
        i = end === -1 ? source.length : end + 2;
      } else {
        const end = source.indexOf("\n", i + 2);
        i = end === -1 ? source.length : end + 1;
      }
      continue;
    }

    if (!inMarkup && (ch === '"' || ch === "'" || ch === "`")) {
      quote = ch;
      i++;
      continue;
    }

    if (inMarkup) {
      if (!buffer) at = i;
      buffer += ch;
    }
    i++;
  }

  flush();
  return nodes;
}

/**
 * Whether a text node is prose.
 *
 * Two or more whitespace-separated runs containing a word character. See the
 * header for the measurement that chose this over "a space between two letters"
 * — the latter misses "© 2026 YeRide", the only prose in the tree when the rule
 * landed.
 *
 * `\w` rather than `\p{L}` is deliberate and is the whole difference: a year is
 * copy, and a rule that cannot see one cannot see a copyright line.
 */
export function isProse(text) {
  return text.trim().split(/\s+/).filter((word) => /\w/.test(word)).length >= 2;
}
