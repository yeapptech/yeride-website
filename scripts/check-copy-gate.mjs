// Copy-gate lint — gated and never-claimed strings must not reach the site.
// Wayfinder #41; the string list is docs/copy-map.md §5 (on the copy-map/en-es
// branch until it merges).
//
// Dumb on purpose: comments are stripped, everything else under src/ and
// public/ is matched against a fixed pattern list. A string that has to stay in
// the source without running — the suspended pass-through family is the case
// this was built for — is exempted one line at a time with
//
//     // copy-gate-allow: <why, naming the ticket that retires it, e.g. #48>
//
// The pragma must OPEN its own comment, must name a ticket, and one that stops
// matching anything fails the build, so the allowlist cannot outlive its reason.
// "Opens its own comment" is the whole rule and it is scripts/copy-gate-pragma.mjs,
// in a module of its own because #100 executed the old rule and it did not hold:
// it asked only whether a comment opener appeared ANYWHERE earlier on the line,
// and a URL contains "//", so shipped markup could authorise its own gated claim.
// Read that module before loosening this — it argues why anchoring is the answer
// rather than reusing stripComments, which models a different question.
//
// ONE PLACE HAS NO ESCAPE HATCH, and #81 made it reachable: a file under public/
// whose type has no comment syntax — .json, .webmanifest. Those are read as
// markup now, because they ship byte for byte, so a legitimate phrase in one can
// fail this gate with no way to bless it. That is deliberate rather than
// unnoticed. The only pragma such a file could carry would sit inside a shipped
// string value, which is precisely the "shipped data authorising itself" that
// the pragma rule exists to refuse. Reword the copy, or move the file's text
// into a .astro component where a pragma is possible. (#100 looked at inventing
// a mechanism and left it where #81 did: nothing under public/ is a .json today,
// so there is still no case to design against.)
//
// HOW IT READS A FILE — two passes.
//
// 1. Line by line, raw. This is the pass that gives the gate its value: an exact
//    file and line at the point of authorship.
// 2. Whole-file, normalised, through scripts/copy-gate-normalise.mjs — the same
//    reading machine check-dist-copy-gate.mjs uses. Character references are
//    decoded, invisible characters removed, JS and CSS escapes resolved,
//    whitespace collapsed, and markup additionally read with its tags removed.
//    A match here is a span of original bytes, so it is still reported with a
//    line number — a range, when the phrase crosses one.
//
// Pass 2 exists because pass 1 alone was missing accidents, not just evasion
// (#68 measured three: "no</strong> surprises", "at&nbsp;cost", and a phrase
// wrapped across a newline). Those only failed after a merge, in the dist gate,
// on main. A hit found only by pass 2 names the view that found it.
//
// The allowlist is unchanged and still per line: a pragma covers the line a
// match STARTS on. It has to be the start rather than any line in the span,
// because the alternative is the laundering shape an earlier review already
// closed here — a pragma further down authorising a claim whose reader, looking
// at the line it begins on, sees no pragma at all.
//
// WHAT THIS STILL CANNOT DO — read before trusting it:
//   - a phrase whose ONLY separator is a tag boundary, with or without whitespace
//     around it: "<td>no</td><td>surprises</td>" and "<span>no</span>
//     <span>surprises</span>" alike. Reading those needs the view that turns a tag
//     into a space, which also invents phrases nobody wrote; this gate declines it
//     so that no pragma here has to bless a phantom, and the dist gate takes it
//     instead. copy-gate-normalise.mjs argues the split at length.
//   - copy COMPOSED BY THE BUILD out of parts that are innocent in the source.
//     "<p>{copy.lead} {copy.tail}</p>" with lead "no" and tail "surprises" is two
//     harmless strings here and one forbidden phrase in the built HTML, where the
//     dist gate's plainest view sees it. So is anything Rollup folds — "insur" +
//     "ance". This is the category #68's first pass left out of its own list of
//     what remains to the dist gate, and it is the one a PR author hits by
//     accident, not by evasion.
//   - copy assembled at runtime in the BROWSER, and copy that arrives from the
//     fee-schedule endpoint — neither is in the source or the build. The first is
//     beyond both gates; the second belongs to #56.
//   - a normalised hit is very nearly always only an ACCUSATION, and #82 opened
//     the single exception rather than removing the rule. §5 permits one phrase,
//     "no surge today", which used to be a negative lookahead on the forbidden
//     pattern and so held only for the exact bytes that lookahead saw: splitting
//     it with an &nbsp;, a line wrap or a <b> failed the build on copy §3.4
//     expressly allows, while every view could see it was permitted and none was
//     asked. A pattern may now declare `permits`, and a hit is WITHDRAWN when a
//     non-fabricating view reads that permitted phrase over the same bytes. It is
//     the only thing in either gate that turns a failure into a pass; the bounds
//     that keep it from becoming a hole are on permissionsIn in
//     copy-gate-normalise.mjs, and both directions are proved end to end, through
//     this script and through the dist gate, by copy-gate-patterns.test.mjs.
//   - a NAMED reference outside copy-gate-normalise.mjs's table, which stays
//     finite and is argued there. #80 closed the rest of that list: the invisible
//     class is now a Unicode property rather than eight of its members, numeric
//     references follow HTML5 (unbounded digits, optional semicolon), and the
//     confusable check below reads every normalised view as well as the raw line,
//     so a homoglyph written as an escape no longer survives being decoded.
//     One residue, and it is narrower than it first reads: pass 2 sees
//     comment-stripped text, so a confusable written as an ESCAPE survives only
//     inside the comments stripComments actually blanks — a LINE-LEADING "//" or
//     "/* */". A trailing inline "//" is not stripped (mid-line openers are far
//     more likely to be shipped text), and an HTML comment is not stripped at all
//     because Astro emits it into the built page, so an escape in either of those
//     still fails. A LITERAL confusable is caught in every comment, everywhere.
//   - a tag-split phrase in a compiled file under src/ — a .ts, a .json, a .yml.
//     #81 settled this deliberately rather than by omission, but on TWO different
//     grounds and only one of them is the generics argument. For .ts: a "<" there
//     is a generic and not a tag, and every innerHTML assignment in this repo is
//     written inside a .astro component, which IS read as markup here. For .json
//     and .yml, where a "<" really is a tag, the ground is narrower — nothing
//     under src/ is served, so it reaches a reader only through a .astro
//     component or through the build, and the dist gate reads that result as
//     markup. A lost authorship-time backstop, not a production hole.
//     Everything under public/ ships byte for byte and so IS read as markup
//     whatever its extension. See scripts/copy-gate-files.mjs.
//   - anything in a file type SCAN_EXT does not list. Those are named on every
//     run as "not read:", success or failure, so the gap is visible rather than
//     rediscovered.
//
// The second layer, scripts/check-dist-copy-gate.mjs (#57), still runs this same
// pattern list over the built output and still earns its place — it reads
// vendored code and whatever the build injects, and it measures the promise
// itself. Keep both.
//
// Three §5 rules are judgement, not regex, and are NOT checked here — they stay
// human review at copy time. The list lives with the patterns.

import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

import { PATTERNS } from "./copy-gate-patterns.mjs";
import { BINARY, MARKUP_SYNTAX, SCAN_EXT, walk } from "./copy-gate-files.mjs";
import {
  isPermitted,
  lineIndex,
  matchesIn,
  permissionsIn,
  viewsOf,
} from "./copy-gate-normalise.mjs";
import {
  TICKET,
  collectPragmas,
  pragmaFor,
  readPragma,
  unusedPragmas,
} from "./copy-gate-pragma.mjs";
import { passthroughFiling } from "./copy-gate-suspension.mjs";

// public/ is copied verbatim into dist/, so it ships exactly as written.
const ROOTS = ["src", "public"];
// Which of the two roots is SERVED rather than compiled. Everything under
// public/ reaches the browser byte for byte, so a "<" in it opens a tag whatever
// the extension says — an HTML fragment inside public/content.json ships as
// written. Under src/ only the markup file types are read that way, because a
// "<" in a .ts is a generic and reading it as a tag swallows real code. #81
// measured both sides; scripts/copy-gate-files.mjs records the numbers.
const SERVED_VERBATIM = /^public[/\\]/;

// Homoglyphs, answering #57's "is folding honest?" with no. A Cyrillic "\u0435"
// in "ch\u0435apest" defeats every pattern above, and folding confusables back to
// ASCII needs a table whose wrong entries would invent failures in Spanish copy.
// The confusable is itself the defect, so it is caught rather than folded — and
// caught HERE, not over dist/, because src/ and public/ are wholly authored in
// this repo. A vendored bundle may legitimately carry other scripts; a YeRide
// page in English or Spanish never does.
//
// Curated, not whole blocks. An earlier revision took the Greek block entire and
// failed on "\u0394/\u0394t" and "\u03c0" in a comment — legitimate maths, no
// resemblance to a Latin letter. Only the letters that can PASS FOR Latin are
// listed, so:
//   - Cyrillic entire: no Cyrillic letter belongs in EN or ES copy at all.
//   - Greek: the Latin lookalikes only. \u0394, \u03c0, \u03bc, \u03bb and \u03a9
//     are left alone.
//   - Cherokee, fullwidth Latin, Mathematical Alphanumeric Symbols, Roman-numeral
//     forms, small-capital phonetic letters, and the letterlike \u2126/\u212a/\u212b
//     — each of which renders as something a reader takes for an ASCII letter.
// Accented Latin is untouched throughout: \u00e1, \u00e9, \u00f1 and \u00fc are Latin.
//
// Suppressible by the same copy-gate-allow pragma as any other hit, because a
// legitimate exception is possible and an unsuppressable failure is not a gate,
// it is a wall.
const CONFUSABLE = new RegExp(
  "[" +
    "\\u0400-\\u04FF" + // Cyrillic
    "\\u0391\\u0392\\u0395\\u0396\\u0397\\u0399\\u039A\\u039C\\u039D\\u039F\\u03A1\\u03A4\\u03A5\\u03A7" + // Greek capitals shaped like Latin
    "\\u03B1\\u03B9\\u03BA\\u03BD\\u03BF\\u03C1\\u03C3\\u03C5\\u03C7" + // Greek lowercase shaped like Latin
    "\\u13A0-\\u13FF" + // Cherokee
    "\\u1D00-\\u1D25" + // small-capital phonetic letters
    "\\u2126\\u212A\\u212B" + // ohm, kelvin, angstrom
    "\\u2160-\\u217F" + // Roman numeral forms
    "\\uFF21-\\uFF3A\\uFF41-\\uFF5A" + // fullwidth Latin
    "]|[\\u{1D400}-\\u{1D7FF}]", // Mathematical Alphanumeric Symbols
  // GLOBAL because both readers below want every hit on a line, not the first;
  // see the raw pass for what a first-hit-only reading mislabelled. Safe to share
  // even though a /g regex carries lastIndex, because matchAll is the ONLY thing
  // that consumes this: it clones the regex and leaves the original's lastIndex
  // alone. Calling .test() or .exec() on it would make it stateful across files —
  // don't.
  "gu",
);

// One dedupe-key shape for every pass in this file. NUL separates because it
// cannot occur in a line number, a pattern index, or matched copy — and writing
// it ONCE is the point: four call sites each spelling their own separator is how
// the two halves of a dedupe drift apart while both still look right.
const key = (...parts) => parts.join("\u0000");

// Blank comments out, keeping every newline so line numbers still line up.
//
// Only LINE-LEADING comment openers are stripped. A "//" or "/*" mid-line is far
// more likely to be shipped text or a string literal than a comment — blanking
// those let "Ride now // insurance at cost" through, and let "images/*" pair
// with a later "*/" to swallow the lines between. HTML comments are NOT stripped
// at all: Astro emits <!-- --> into the built HTML, so they do ship.
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return src
    .replace(/^[ \t]*\{?[ \t]*\/\*[\s\S]*?\*\//gm, blank)
    .replace(/^[ \t]*\/\/.*$/gm, blank);
}

const errors = [];
const allowed = [];
const pragmas = [];
let scanned = 0;

const everything = ROOTS.flatMap(walk);
const files = everything.filter((p) => SCAN_EXT.test(p));

/** The extension used in the "not read" notice. A dotfile is its own name, not an
 *  extension — ".nojekyll" is a file called .nojekyll. */
const extensionOf = (path) => {
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "(no extension)" : name.slice(dot);
};

// #68 claimed this gate now sees everything the dist gate does. It does not: the
// dist gate reads .xml and .webmanifest, and it reads all of dist/ rather than
// two source roots. Naming what went unread is how that narrowing stays visible
// instead of being rediscovered.
const unreadTypes = [
  ...new Set(everything.filter((p) => !SCAN_EXT.test(p) && !BINARY.test(p)).map(extensionOf)),
].sort();

for (const file of files) {
  scanned++;
  const source = readFileSync(file, "utf8");
  const raw = source.split(/\r?\n/);
  // stripComments blanks with spaces and keeps every newline, so codeText is the
  // same length as source and an offset into it is an offset into the file.
  const codeText = stripComments(source);
  const code = codeText.split(/\r?\n/);

  // lineStarts indexes codeText, which `code` was split from, so a line start
  // plus a match index is an offset into the file.
  const { starts: lineStarts, at: lineAt } = lineIndex(codeText);

  // The pragma reading, the line pairing, the ticket rule and the unused sweep
  // all live in copy-gate-pragma.mjs and are called from here rather than
  // written here, so this gate and #88's prose gate cannot drift on the one
  // mechanism whose job is to make a build say LESS.
  const found = collectPragmas(source, file, readPragma);
  pragmas.push(...found.pragmas);
  for (const at of found.misplaced) {
    errors.push(
      `${at.file}:${at.line}  copy-gate-allow must OPEN its own comment — nothing but ` +
        `whitespace between the comment opener and the pragma. A "//" inside a URL is ` +
        `not a comment, and shipped markup must not be able to authorise itself`,
    );
  }

  const judge = (here, hit, why, where = `${file}:${here}`) => {
    const pragma = pragmaFor(pragmas, file, here);

    if (!pragma) {
      errors.push(`${where}  ${hit} — ${why}`);
    } else if (!TICKET.test(pragma.reason)) {
      errors.push(`${where}  copy-gate-allow must name the ticket that retires it, e.g. "#48"`);
      pragma.used = true;
    } else {
      pragma.used = true;
      allowed.push(`${where}  ${hit} — ${pragma.reason}`);
    }
  };

  const views = viewsOf(codeText, {
    markup: SERVED_VERBATIM.test(file) || MARKUP_SYNTAX.test(file),
    css: /\.css$/i.test(file),
    // See copy-gate-normalise.mjs: the fabricating views belong to the dist gate,
    // because a per-line pragma blessing a phrase nobody wrote teaches the next
    // reader that this gate cries wolf.
    includeFabricating: false,
  });

  // §5's permitted exceptions, as spans of this file's bytes (#82). This is the
  // one thing a view may do that makes the gate say LESS, and it is read before
  // either pass so that both consult it — pass 1 above all, because a raw line is
  // exactly where the permitted phrase gets split by an &nbsp;, a line wrap or a
  // <b>. permissionsIn holds the bounds; the short version is that only a pattern
  // declaring `permits` is withdrawable, only a positive reading of §5's own
  // permitted words withdraws it, only a non-fabricating view may read them, and
  // only over the same bytes.
  const permissions = permissionsIn(views, PATTERNS);

  // Pass 1 — raw, line by line. Reported exactly as it always was.
  const reported = new Set();
  code.forEach((line, i) => {
    for (const [at, { re, why }] of PATTERNS.entries()) {
      const hit = line.match(re);
      if (!hit) continue;
      // lineStarts indexes codeText, which `code` was split from, so a line start
      // plus the match index is an offset into the file — the same coordinates
      // every view maps back to. A raw match drops nothing, so its bytes are the
      // contiguous run; a view's are not, which is why isPermitted takes offsets.
      const from = lineStarts[i] + hit.index;
      const offsets = Array.from({ length: hit[0].length }, (_, k) => from + k);
      if (isPermitted(permissions, at, offsets)) continue;
      reported.add(key(i + 1, at, hit[0].toLowerCase()));
      judge(i + 1, `"${hit[0]}"`, why);
    }
  });

  // Pass 2 — the same patterns over the normalised views. Only hits pass 1 could
  // not see are printed, each naming the view that found it.
  for (const { at, text, view: viewName, span, offsets } of matchesIn(views, PATTERNS)) {
    if (isPermitted(permissions, at, offsets)) continue;
    const start = lineAt(span[0]);
    const id = key(start, at, text);
    if (reported.has(id)) continue;
    reported.add(id);
    const end = lineAt(span[1] - 1);
    judge(
      start,
      `"${text}" [${viewName}]`,
      PATTERNS[at].why,
      `${file}:${start}${end > start ? `-${end}` : ""}`,
    );
  }

  // Homoglyphs, from the RAW line first — comments included, because an HTML
  // comment in an .astro file ships and a confusable is worth catching wherever it
  // is — and then from each normalised view.
  //
  // The second half is #80. Pass 2 DECODES "ch&#1077;apest" into a Cyrillic "e"
  // and then discarded it, because this check only ever read raw lines: the gate
  // built the evidence and threw it away. Every confusable is now read from every
  // view this gate takes.
  //
  // #57 kept confusables source-only because a vendored bundle may legitimately
  // carry another script. That reasoning SURVIVES rather than being worked around:
  // pass 2's views are views of source, so nothing vendored is in scope here, and
  // the dist gate is left alone.
  //
  // A hit found only in a view is reported at the ESCAPE's line, not at some
  // position in a derived string — the span map already points at the bytes an
  // author has to edit, and telling them where the decoded character "is" would
  // name a place that exists in no file.
  // No `where`: every caller passed exactly `${file}:${at}`, which is judge's own
  // default, so the argument only gave two places for one fact to disagree.
  const flagConfusable = (at, text, note) => {
    const point = `U+${text.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
    judge(
      at,
      `"${text}" (${point})${note}`,
      "not a Latin letter, but shaped like one — a homoglyph hides a gated word from every pattern above",
    );
  };

  // EVERY confusable on the raw line, not just the first. The view pass below
  // matches globally, so a line-first raw pass mislabels: with two confusables on
  // one line the raw pass claimed the first and the view pass then reported the
  // second as "[plain]" — a view finding, for a character sitting in plain sight
  // in the source. Naming the wrong cause is the fault the gates exist to remove,
  // and a label nobody can act on is the shape it takes here.
  // Both passes dedupe on (line, character), and BOTH have to — the raw pass
  // gained a `has` check the moment it went global. One line reads the same in
  // both directions, so two occurrences of the SAME confusable on it produce two
  // byte-identical error lines with no column to tell them apart: noise that
  // reads as two defects. Two DIFFERENT confusables on one line still report
  // twice, because they are two things to fix.
  const confusables = new Set();
  const flagOnce = (line, text, note) => {
    const id = key(line, text);
    if (confusables.has(id)) return;
    confusables.add(id);
    flagConfusable(line, text, note);
  };

  raw.forEach((line, i) => {
    for (const m of line.matchAll(CONFUSABLE)) flagOnce(i + 1, m[0], "");
  });

  for (const { name, text, map } of views) {
    for (const m of text.matchAll(CONFUSABLE)) {
      flagOnce(lineAt(map[m.index]), m[0], ` [${name}]`);
    }
  }
}

for (const p of unusedPragmas(pragmas)) {
  errors.push(`${p.file}:${p.line}  copy-gate-allow matches nothing any more — delete it`);
}

// Copy-map §3.4 suspends the family-2 heading, lead and insurance note "until
// #48 gives them members again, gated by #41 until then". The pragmas above only
// RECORD that suspension; this enforces it. Those strings render the moment any
// charge is filed into the passthrough family — and they are already in the
// shipped JS bundle, dormant rather than absent — so the data and the allowlist
// have to move together.
const LABELS = "src/i18n/feeLabels.ts";
// Scoped to the /fees copy, because that is the only copy §3.4 suspends. The
// legal pages (#44) also name #48 — they STATE that YeRide has no insurance,
// and the gate cannot tell that denial from a claim — but they are not part of
// the pass-through suspension and must not be swept into "retire these". They
// do have to be rewritten when #48 lands, since the statement becomes false;
// that is recorded on #48 itself rather than enforced by this rule, which would
// otherwise demand the legal pages drop a pragma they still need.
const SUSPENSION = /^src[/\\](i18n[/\\]fee(Labels|sCopy)\.ts|components[/\\]FeeSchedule\.astro)$/;
const suspended = pragmas.filter(
  (p) => /#48(?!\w)/.test(p.reason) && SUSPENSION.test(p.file),
);
// The reading itself is scripts/copy-gate-suspension.mjs, so it can be proved to
// fire (#83 found it enforced §3.4 against double quotes only, and nothing had
// ever asked it to). It answers "cannot tell" separately from "not filed": a
// renamed or deleted charge map must fail here, not silently un-arm the guard.
if (suspended.length) {
  const filing = passthroughFiling(
    existsSync(LABELS) ? stripComments(readFileSync(LABELS, "utf8")) : null,
  );
  if (!filing.readable) {
    errors.push(
      `${LABELS}  the §3.4 suspension guard cannot read this file — ${filing.why}. ` +
        `Until it can, nothing checks whether the suspended family-2 copy has gone live; ` +
        `point scripts/copy-gate-suspension.mjs at the charge map's new home`,
    );
  } else if (filing.filed) {
    errors.push(
      `${LABELS}  a charge is now filed into the "passthrough" family, so the family-2 copy ` +
        `renders on /fees — #48 has landed, so retire its ${suspended.length} copy-gate-allow ` +
        `pragma(s) and the §3.4 suspension with it`,
    );
  }
}

if (errors.length) {
  console.error(`✗ copy gate (${scanned} files)`);
  for (const e of errors) console.error(`  ${e}`);
  for (const ext of unreadTypes) console.error(`  not read: ${ext} — add it to SCAN_EXT if it can carry copy`);
  console.error(`\n  The list is docs/copy-map.md §5, on the copy-map/en-es branch until it merges:`);
  console.error(`    git show origin/copy-map/en-es:docs/copy-map.md`);
  console.error(`  To keep a string that does not run, put "// copy-gate-allow: <why> (#ticket)"`);
  console.error(`  on the line directly above it, or ahead of it on its own line. The pragma`);
  console.error(`  must OPEN its comment — a comment opener elsewhere on the line does not`);
  console.error(`  count, so a "//" inside a URL will not do it (#100).`);
  process.exit(1);
}

console.log(`✓ copy gate (${scanned} files)`);
for (const a of allowed) console.log(`  allowed: ${a}`);
for (const ext of unreadTypes) console.log(`  not read: ${ext} — add it to SCAN_EXT if it can carry copy`);
