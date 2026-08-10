// Controls for the .astro prose rule. Plain node, no runner, no deps:
//
//     node scripts/astro-prose.test.mjs
//
// Wayfinder #88 added this file with the rule it covers. The rule's hatch has
// ZERO live users — the one case #79 named for it dissolved when #39 put
// redirect.astro through BaseLayout — so unlike every other gate on this repo
// there is no live pragma whose survival proves the hatch works. It is proved
// here or it is not proved at all, and "a guard whose enforcement is assumed" is
// this map's recurring failure (#59).
//
// TWO LAYERS, the same shape and the same reason as copy-gate-suspension.test.mjs
// and copy-gate-pragma.test.mjs:
//
// 1. The reader alone — textNodes/isProse over the syntaxes an .astro file
//    actually contains. Its second list is the valuable half, as ever: this rule
//    reports on TEMPLATE TEXT, and over-reach means failing the build on a
//    component nobody may edit. Every "must not be a text node" entry below is a
//    shape that exists in this repo.
// 2. check-astro-prose.mjs ITSELF, spawned over a temporary fixture tree.
//    Between the reader and the claim sit the import wiring, the pragma
//    pairing, the ticket rule and the "matches nothing" sweep — and a reader
//    returning the right answer into a caller that ignores it is exactly the
//    failure #83 found by deleting an errors.push and watching every
//    reader-level control stay green.
//
// The fixture is a temp directory, never the real tree. That the REAL tree
// passes is asserted by the gate's own green run one step later in
// `npm run checks`.
//
// This lives in scripts/, which neither copy gate scans, so the phrases below
// are safe to write down.
import { fileURLToPath } from "node:url";

import { isProse, templateStart, textNodes } from "./astro-prose.mjs";
import { runGate } from "./copy-gate-fixture.mjs";

const GATE = fileURLToPath(new URL("./check-astro-prose.mjs", import.meta.url));

let failures = 0;
let checks = 0;
// COUNTED, not written down — copy-gate-files.test.mjs's rule. Several lists
// below are loops, so a hand-kept total is one deleted entry away from claiming
// coverage that no longer exists.
const say = (ok, label, detail) => {
  checks++;
  if (ok) return;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
  failures++;
};

/** The trimmed text of every non-blank text node, for comparison by value. */
const nodes = (source) => textNodes(source).map((n) => n.text.trim().replace(/\s+/g, " "));

const FENCE = `---\nconst x = 1;\n---\n`;

// ------------------------------------------------------- 1. the reader alone

// MUST BE FOUND as text nodes. A miss here is prose reaching the page with the
// gate green, which is the whole thing this rule exists to stop.
const FOUND = [
  ["a bare paragraph", `${FENCE}<p>Ride now today</p>\n`, "Ride now today"],
  ["text with no frontmatter at all", `<p>Ride now today</p>\n`, "Ride now today"],
  ["a node broken across source lines", `${FENCE}<p>\n  Ride now\n  today\n</p>\n`, "Ride now today"],
  ["text between two expressions", `${FENCE}<p>{a} Ride now today {b}</p>\n`, "Ride now today"],
  // The shape most of this site's markup is actually built in — LegalDocument,
  // BaseLayout, AboutPage and PreRegistrationForm all render through it. A reader
  // that skipped from "{" to "}" would leave the main surface unscanned while
  // appearing to cover it, which is why textNodes follows markup back OUT of an
  // expression rather than treating one as opaque.
  [
    "markup nested inside an expression",
    `${FENCE}<ul>{items.map((i) => (<li>Ride now today</li>))}</ul>\n`,
    "Ride now today",
  ],
  [
    "markup nested two expressions deep",
    `${FENCE}<ul>{a.map((x) => (<li>{b.map((y) => (<span>Ride now today</span>))}</li>))}</ul>\n`,
    "Ride now today",
  ],
  // The regression that made this reader's first run report 49 false findings:
  // an apostrophe inside an expression comment opened a string that never closed,
  // so the walk read straight past <script> and reported the bundled form logic
  // as prose. The control is that text AFTER such a comment is still found.
  [
    "text after an expression comment containing an apostrophe",
    `${FENCE}<div>{/* Stripe's fee is not YeRide's */}<p>Ride now today</p></div>\n`,
    "Ride now today",
  ],
  [
    "text after a line comment inside an expression",
    `${FENCE}<div>{cond // Stripe's own\n  ? null : null}<p>Ride now today</p></div>\n`,
    "Ride now today",
  ],
  // An unterminated "<" is ordinary text to a browser, and swallowing from it to
  // end of file would hide every node after it.
  //
  // The "<" has to actually OPEN a tag for this to test anything, and there must
  // be no ">" anywhere after it — that is the only way tagEnd returns -1. A first
  // draft used `<p>a < b</p>` and proved nothing: "< " is not a tag opening at
  // all (TAG_OPEN wants a name character straight after the "<"), so the branch
  // never ran and disabling it left every control green.
  [
    "text after an unterminated tag",
    `${FENCE}<b Ride now today\n`,
    "<b Ride now today",
  ],
  // Both sides of a ternary that renders markup: the element CONTENT is still
  // page copy even though the expression around it is not. The companion
  // "must not be read as template prose" entry below is the half that matters.
  [
    "element content inside a ternary",
    `${FENCE}<div>{ok ? <b>Ride now today</b> : <i>z</i>}</div>\n`,
    "Ride now today",
  ],
  // A "}" with no expression open is ordinary text to a browser. The flag
  // version discarded the buffer here, so a phrase could hide in front of a
  // stray brace and the gate would report only what followed it.
  [
    "a node containing a stray closing brace",
    `${FENCE}<p>Ride today } always</p>\n`,
    "Ride today } always",
  ],
];

for (const [name, source, expected] of FOUND) {
  say(nodes(source).includes(expected), `must be found as a text node — ${name}`, JSON.stringify(nodes(source)));
}

// MUST NOT BE a text node. The valuable half: each of these is real syntax from
// this repo, and reading any of them as template text fails the build on code.
const NOT_TEXT = [
  // Frontmatter is TypeScript. Every component's copy object lives here.
  ["frontmatter", `---\nconst lead = "Ride now today";\n---\n<p>{lead}</p>\n`],
  // A <script> is JavaScript and a <style> is CSS. Reading either as template
  // text reports the whole bundled form logic as prose — measured, 49 findings.
  ["a script body", `${FENCE}<script>\n  const lead = "Ride now today";\n</script>\n`],
  ["a style body", `${FENCE}<style>\n  .x { content: "Ride now today"; }\n</style>\n`],
  ["a script with attributes", `${FENCE}<script is:inline defer>\n  var lead = "Ride now today";\n</script>\n`],
  // An HTML comment ships into the built page, but it is not a text node and
  // nobody reads it. tagEnd already knows where one ends.
  ["an HTML comment", `${FENCE}<!-- Ride now today -->\n`],
  // Expression bodies are code. The stated limit is that {"Ride now today"} is
  // therefore not covered either; the threat model is the accident.
  ["an expression body", `${FENCE}<p>{cond ? "Ride now today" : null}</p>\n`],
  ["an expression comment", `${FENCE}<div>{/* Ride now today */}</div>\n`],
  // A "}" inside a string must not close the expression early and spill the rest
  // of the JavaScript out as a text node.
  ["a brace inside a string in an expression", `${FENCE}<p>{cond ? "a}" : "Ride now today"}</p>\n`],
  ["an escaped quote inside a string in an expression", `${FENCE}<p>{cond ? "a\\"} Ride now today" : b}</p>\n`],
  // MARKUP BUILT INSIDE A TEMPLATE LITERAL — FeeSchedule.astro's posted card and
  // example ledger are both assembled this way, `<th class="…">${esc(label)}</th>`
  // and so on. This is what actually holds the quote tracking: the two entries
  // above turn out to be unobservable (the "}" that closes an expression also
  // clears the buffer, so an early close reports nothing either way), and a
  // mutation run with the tracking disabled left every other control green. Here
  // the "${…}" inside the literal drops back to depth 0 and the following "</td>"
  // flushes what came between it as a text node — reporting a fragment of a
  // string literal as page copy.
  [
    "markup inside a template literal in an expression",
    `${FENCE}<div>{rows.map((r) => \`<td class="py-2">\${r.label} Ride now today</td>\`)}</div>\n`,
  ],
  // THE DEFECT A REVIEW FOUND, and the reason the walk counts elements per frame
  // rather than setting one "inMarkup" flag on every tag. Once the first element
  // inside an expression CLOSED, the flag stayed true and the rest of the
  // expression's JavaScript was read as page copy — an ordinary ternary failed
  // the build. It was live, too: the same shape left `") : ("` in
  // LegalDocument.astro and `")) ) : ("` twice in BaseLayout.astro as text nodes
  // in the real tree, passing only because none holds a word character.
  [
    "JavaScript between two elements in one expression",
    `${FENCE}<div>{ok ? <b>x</b> : "no rides today" && <i>y</i>}</div>\n`,
  ],
  [
    "a call between two elements in one expression",
    `${FENCE}<div>{cond ? <b>a</b> : fmt(x, y) + join(<i>y</i>)}</div>\n`,
  ],
  // A void element has no closing tag, so counting it as open would leave its
  // frame permanently in markup and put the rest of the expression back on the
  // page — the same defect arriving by another door.
  // Both of these need a SECOND element after the string: the "}" that closes an
  // expression also clears the buffer, so a fixture ending at the "}" reports
  // nothing either way and proves nothing. Mutation caught that — the first
  // drafts ended at the brace and stayed green with void handling deleted.
  [
    "a void element with no slash inside an expression",
    `${FENCE}<div>{ok ? <img src="a.png"> : "no rides today" && <i>y</i>}</div>\n`,
  ],
  [
    "a self-closing element inside an expression",
    `${FENCE}<div>{ok ? <br /> : "no rides today" && <i>y</i>}</div>\n`,
  ],
  // Element depth is per FRAME because the two nest independently: closing <b>
  // inside the expression must not be taken to close the <li> outside it.
  [
    "an element closing inside an expression nested in an element",
    `${FENCE}<li>{ok ? <b>y</b> : "no rides today"}</li>\n`,
  ],
  // Attributes and props are OUT OF SCOPE, and that is #79's decision, not an
  // omission: all 24 page files pass literal EN/ES title and description props
  // to BaseLayout, because #37's review deleted twelve such keys from src/i18n
  // for duplicating the page files. A rule covering attributes reverses that.
  ["a title prop", `${FENCE}<BaseLayout title="Your ride, fair and clear. | YeRide" />\n`],
  ["a description prop", `${FENCE}<BaseLayout description="Ride now today, with published fees." />\n`],
  ["an alt attribute", `${FENCE}<img src={mark} alt="Ride now today" />\n`],
  ["an aria-label", `${FENCE}<a href="/fees" aria-label="Ride now today">x</a>\n`],
  // tagEnd's own hardening, inherited rather than re-proved: a ">" inside a
  // quoted attribute or an arrow function does not end the tag.
  ["an arrow function in an attribute", `${FENCE}<button onclick={() => go("Ride now today")}>x</button>\n`],
  ["a closing angle inside a quoted attribute", `${FENCE}<div data-x="a > b" data-y="Ride now today">x</div>\n`],
];

for (const [name, source] of NOT_TEXT) {
  const found = nodes(source).filter((t) => isProse(t));
  say(found.length === 0, `must not be read as template prose — ${name}`, JSON.stringify(found));
}

// Only a LEADING fence is frontmatter. A "---" further down is ordinary text,
// and treating it as a fence would blank everything above it.
say(templateStart(`<p>a</p>\n---\n<p>b</p>\n`) === 0, "a '---' in the body is not a frontmatter fence");
say(templateStart(FENCE) === FENCE.length, "a leading fence ends where it closes", String(templateStart(FENCE)));

// ------------------------------------------------- the prose test itself
//
// #88 named two candidates and left the choice to be made against the real tree.
// Measured over all 35 .astro files there were 11 non-blank text nodes: ten a
// "→" glyph or a bare ":", and one the footer's copyright. That measurement is
// what decides it, and it decides AGAINST the ticket's second candidate — "a
// space between two letters" does not fire on "© 2026 YeRide", because "2026" is
// digits, so it would have shipped a rule that fails to force the one cleanup
// #88 names. These two lists pin the boundary in both directions.
const PROSE = [
  ["the copyright line, the only prose in the tree when the rule landed", "© 2026 YeRide"],
  ["a sentence", "Ride now today"],
  ["two words", "Ride now"],
  ["a year and a word — what candidate B could not see", "2026 YeRide"],
];
const NOT_PROSE = [
  ["the arrow glyph, ten of the eleven real text nodes", "→"],
  ["a bare colon", ":"],
  ["a single word", "Home"],
  ["a lone symbol", "©"],
  ["an em dash", "—"],
  ["a middle dot between expressions", "·"],
  ["punctuation left between expressions", "))"],
  ["a bare comma", ","],
  ["whitespace", "   "],
];

for (const [name, text] of PROSE) say(isProse(text), `must be prose — ${name}`, text);
for (const [name, text] of NOT_PROSE) say(!isProse(text), `must not be prose — ${name}`, text);

// --------------------------------------------------- 2. the gate, end to end
// The gate walks ROOT = "src" relative to its working directory, so a temp tree
// with that one directory is a complete world to it. The spawn is
// scripts/copy-gate-fixture.mjs, shared with the four copy-gate control sets —
// a gate spawned two ways is two claims about what "the gate" does.
const src = (files) => runGate(GATE, { "src/.keep": "", ...files });

const PROSE_MSG = "literal prose in a template";
const MISPLACED_MSG = "astro-prose-allow must OPEN its own comment";

// The baseline. If a clean tree does not pass, every mutation below proves
// nothing.
{
  const { code, out } = src({
    "src/Clean.astro": `${FENCE}<p>{lead}</p>\n<p>→</p>\n`,
  });
  say(code === 0, "fixture baseline — a tree with no template prose must pass", out.trim());
}

// THE POSITIVE CONTROL FOR THE RULE ITSELF.
{
  const { code, out } = src({ "src/Bad.astro": `${FENCE}<p>Ride now today</p>\n` });
  say(code === 1, "the GATE must fail on literal prose in a text node", out.trim());
  say(out.includes(PROSE_MSG), "and must name literal prose as the cause", out.trim());
  say(out.includes("src/Bad.astro:4"), "and must report the line the node starts on", out.trim());
}

// The copyright, byte for byte as Footer.astro carried it. This is the cleanup
// the rule forced, and the control that stops it coming back.
{
  const { code, out } = src({ "src/Footer.astro": `${FENCE}<p>© 2026 YeRide</p>\n` });
  say(code === 1 && out.includes(PROSE_MSG), "the GATE must fail on the footer copyright", out.trim());
}

// The regression, END TO END: an expression comment with an apostrophe must not
// desync the walk and hide everything after it. The reader-level control above
// proves the node is found; this proves the gate still fails on it.
{
  const { code, out } = src({
    "src/Fees.astro": `${FENCE}<div>{/* Stripe's fee is not YeRide's */}<p>Ride now today</p></div>\n`,
  });
  say(code === 1 && out.includes(PROSE_MSG), "the GATE must fail on prose after an expression comment", out.trim());
}

// A <script> body must not fail the build. This is the false-positive direction,
// and it is the one that would have made the gate unusable on its first run.
{
  const { code, out } = src({
    "src/Form.astro": `${FENCE}<script>\n  const msg = "Ride now today";\n  form.textContent = msg;\n</script>\n`,
  });
  say(code === 0, "a script body must not fail the build", out.trim());
}

// Attributes and props are out of scope — #79's decision, asserted through the
// gate and not only through the reader, because this is the boundary a future
// change is most likely to widen.
{
  const { code, out } = src({
    "src/Page.astro": `${FENCE}<BaseLayout title="Your ride, fair and clear. | YeRide" description="Ride now today." />\n`,
  });
  say(code === 0, "literal title and description props must not fail the build", out.trim());
}

// ------------------------------------------------------------- the hatch
// It ships with NO live user, so every one of its behaviours is proved here or
// nowhere.

{
  const { code, out } = src({
    "src/Legal.astro": `${FENCE}<!-- astro-prose-allow: quoted statute, cannot move (#88) -->\n<p>Ride now today</p>\n`,
  });
  say(code === 0, "a pragma on the line above blesses the node", out.trim());
  say(out.includes("quoted statute, cannot move (#88)"), "and the gate prints its reason", out.trim());
  say(!out.includes("-->"), "and the reason does not carry its closing delimiter", out.trim());
}

// ...and it covers a node on its OWN line, reachable exactly when the pragma
// opens a comment that then CLOSES, leaving text after it. The gate's failure
// footer, its pragma pairing and CLAUDE.md all say "the line the node starts
// on" — three places that have to agree.
//
// The pragma still has to be FIRST on that line. An earlier draft of this
// control wrote `<p><!-- astro-prose-allow: … -->Ride now today</p>` and the
// gate refused it, correctly: #100's rule is position, not presence, and markup
// preceding the pragma is exactly the shape that lets shipped text authorise
// itself.
{
  const { code, out } = src({
    "src/Legal.astro": `${FENCE}<!-- astro-prose-allow: quoted statute (#88) -->Ride now today\n`,
  });
  say(code === 0, "a pragma covers a node starting on its own line", out.trim());
}

{
  const { code, out } = src({
    "src/Legal.astro": `${FENCE}<!-- astro-prose-allow: brand approved -->\n<p>Ride now today</p>\n`,
  });
  say(code === 1 && out.includes("must name the ticket"), "a ticketless pragma must fail", out.trim());
}

{
  const { code, out } = src({
    "src/Legal.astro": `${FENCE}<!-- astro-prose-allow: quoted statute (#88) -->\n<p>{lead}</p>\n`,
  });
  say(
    code === 1 && out.includes("matches nothing any more"),
    "a pragma that matches nothing must fail, so the allowlist cannot outlive its reason",
    out.trim(),
  );
}

// #100's exploit, in this gate's token. A pragma must OPEN its comment, so
// shipped markup cannot authorise itself with a "//" borrowed from a URL — and a
// misplaced one is an ERROR, never a silent no-op, because its author believes
// they are covered.
{
  const { code, out } = src({
    "src/Bad.astro": `${FENCE}<p data-src="https://x.test/a">Ride now today astro-prose-allow: ok #88</p>\n`,
  });
  say(code === 1, "the GATE must fail on #100's exploit line in this token", out.trim());
  say(out.includes(MISPLACED_MSG), "and must name the misplaced pragma as the cause", out.trim());
}

// The two gates must not read each other's pragmas — the reason the tokens
// differ at all. check-copy-gate.mjs fails on a `copy-gate-allow` matching
// nothing, so a shared token would have every prose pragma reported as dead by
// the other gate.
{
  const { code, out } = src({
    "src/Legal.astro": `${FENCE}<!-- copy-gate-allow: the other gate's token (#88) -->\n<p>Ride now today</p>\n`,
  });
  say(code === 1 && out.includes(PROSE_MSG), "a copy-gate-allow must not bless template prose", out.trim());
}

console.log(
  `${failures ? "✗" : "✓"} astro prose: ${checks} controls, ${failures} failure${failures === 1 ? "" : "s"}`,
);
process.exit(failures ? 1 : 0);
