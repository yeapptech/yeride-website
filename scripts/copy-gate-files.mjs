// Which files the copy gates read, and which of them are read as markup.
// Wayfinder #81. One table, imported by both gates, for the same reason
// copy-gate-patterns.mjs and copy-gate-normalise.mjs are shared: a file type
// present in one gate's list and absent from the other reads as covered when it
// is not. That is not hypothetical — it is how these two lists actually stood.
// The source gate scanned .astro/.ts/.yml and not .xml/.webmanifest/.xhtml; the
// dist gate scanned .xml/.webmanifest/.map and not .yml. Neither divergence was
// a decision; both were an oversight nobody had a reason to notice, because
// nothing compared the lists. Importing one constant makes them comparable by
// construction rather than by review.
//
// ---------------------------------------------------------------------------
// THE MARKUP QUESTION, which is what #81 was filed about.
//
// A file read "as markup" gets the tag views: the scan treats "<" as opening a
// tag and reads to the matching ">". That is worth a great deal on a page —
// "Flat fees, <strong>no</strong> surprises." is a claim no single-pass matcher
// sees — and it is actively harmful where "<" is an operator, because the scan
// then swallows real text up to the next ">" and joins what was either side of
// it, inventing an adjacency the author never wrote.
//
// #81 asked whether the tag views should simply run on everything. Measured over
// this repo's own trees rather than argued:
//
//   - src/, 13 non-markup files, all .ts: 19 false tag spans, 345 bytes, the
//     longest 41. Every one is a TypeScript generic (Map<string, ChargeLabel>)
//     or the triple-slash reference in env.d.ts. None welds a §5 phrase today.
//   - dist/, the .js bundles: 127 false spans swallowing 27,004 bytes — 35.5% of
//     the bundle text — the longest single span 16,250 bytes, where a minified
//     "r<t.length" runs to a ">" four functions away.
//
// So the cost is real and it is not symmetric. What decides it is not the
// measurement alone but what the file IS:
//
//   SERVED BYTES get the tag views. Everything under dist/ is publicly
//   fetchable, and everything under public/ is copied into dist/ byte for byte.
//   A "<" in those is markup a browser will read, whatever the extension says —
//   which is precisely #81's two cases: a bundle assigning tag-split markup to
//   innerHTML, and an HTML fragment inside public/content.json.
//
//   AUTHORING SOURCE does not, beyond the file types where tags are the syntax
//   (.astro, .html, .svg, .md). A .ts file under src/ is compiled, not served,
//   and its "<" is a generic. The benefit that would justify the noise is not
//   there either: every innerHTML assignment in this repo is written inside a
//   .astro component, which already gets the tag views at authorship time. The
//   .ts exclusion #68 made was right, and it is kept here for a measured reason
//   rather than an assumed one — with scripts/copy-gate-files.test.mjs holding
//   the generic that must not fail the build.
//
//   The same exclusion catches .json and .yml under src/, and that half is NOT
//   carried by the generics argument — in a .json a "<" IS a tag, which is the
//   ticket's own case. It rests on something narrower: nothing under src/ is
//   served, so such a file reaches a reader only through a .astro component
//   (which is read as markup here) or through the build (where the dist gate
//   reads the result as markup). It is a lost authorship-time backstop, not a
//   production hole, and it is written down rather than implied because the
//   measurement below says nothing about it: all 13 non-markup files in src/ are
//   .ts, so no .json or .yml was ever weighed.
//
// ---------------------------------------------------------------------------
// WHAT READING SERVED BYTES AS MARKUP DOES NOT BUY, stated because the obvious
// reading of the paragraph above overstates it.
//
// In minified JavaScript the tag scan is wrong far more often than it is right:
// "r<t.length" opens a span that runs to the next ">", which can be four
// functions away. A claim that lands INSIDE such a span is invisible to the tag
// views — and the plain view does not rescue it, because to the plain view the
// claim is still split by its tag. So the hole #81 was filed over is NARROWED,
// not closed. Measured on this build:
//
//   dist/_astro/FareEstimatePage…js   40.1% of bytes inside a false span
//   dist/_astro/FeeSchedule…js        17.8%
//
// An adversarial review demonstrated it rather than deduced it: the same
// tag-split claim injected into the real FareEstimatePage bundle fails the gate
// at offset 1000 and passes green at offsets 3000 and 12000.
//
// The mirror of that miss is a false failure — a long span DELETED welds the
// identifiers either side into a phrase nobody wrote, and the same review built
// a plausible minified fixture that fails on "rates=i0)flat". That direction is
// at least loud, and one ALLOWED entry retires it, which is the trade this gate
// already takes on a vendor chunk's regex backreference.
//
// Both would be fixed by bounding the tag scan, and that was left undone rather
// than overlooked: the longest GENUINE tag in this repo's own output is 2,825
// bytes of SVG path data, so no length bound cleanly separates a real tag from a
// JavaScript comparison, and choosing one is a change to the shared normaliser
// affecting every markup file. It is its own decision, filed as its own ticket.
//
// #81's other two candidate answers were considered and are recorded as
// rejected, because the measurement is what rejects them:
//
//   CONTENT SNIFFING — give the tag views to any file containing /<[a-zA-Z]/ —
//   discriminates nothing. Of the 13 non-markup files in src/, 10 match, and all
//   13 are .ts: the sniff selects almost exactly the files where "<" is an
//   operator, which is the case it was supposed to exclude. In dist/ it does the
//   opposite harm, dropping a bundle that happens to contain no "<" today and so
//   making coverage depend on a property of the minifier's output. It also makes
//   what the gate checks invisible to the author, which a filename is not.
//
//   ONE RULE FOR EVERYTHING, markup views on every scanned type in both gates,
//   buys nothing in src/ at the price of the fabrication surface measured above.

// Case-insensitive throughout: #57 fixed exactly this in the dist gate after a
// review found "evade.HTML" was never read at all.
export const SCAN_EXT =
  /\.(astro|ts|tsx|js|jsx|mjs|cjs|md|mdx|html?|xhtml|json|map|ya?ml|svg|css|txt|xml|webmanifest)$/i;

// Extensions that cannot carry readable copy. Everything scanned by neither this
// nor SCAN_EXT is NAMED in each gate's output, on the failure path as well as the
// success one: a file type silently ignored reads as a file type cleared.
//
// .map is in SCAN_EXT rather than here, which is the dist gate's call adopted by
// both. A source map is served, and it is JSON carrying the original source text
// verbatim — a claim deleted from a page but left in its sourcemap is still
// fetchable. The source gate previously listed it as binary; nothing in src/ or
// public/ is a .map, so that was never a decision either.
export const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|pdf|mp4|webm|zip|gz)$/i;

// File types where "<" opens a tag because that is the syntax, independent of
// whether the file is served as-is. .md and .mdx can hold literal HTML; .astro is
// where prose gets typed straight into markup.
export const MARKUP_SYNTAX = /\.(astro|html?|xhtml|svg|xml|md|mdx)$/i;
