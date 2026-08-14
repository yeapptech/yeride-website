// Controls for the contrast gate. Plain node, no runner, no deps:
//
//     node scripts/contrast.test.mjs
//
// Wayfinder #76 added scripts/check-contrast.mjs, and its rule has a cost on
// both sides, so both lists below are load-bearing. Too narrow and the gate
// misses the `text-ink/60` it exists to stop; too wide and it fails the build
// on a class that is perfectly legal — `border-ink/20`, `bg-paper/5`, or a bare
// `text-ink`, all of which appear all over src/ and none of which it may touch.
//
// TWO LAYERS, and the second is the one that matters. The first calls the
// reader directly. The second SPAWNS the gate over temporary fixture trees, for
// the reason #83 gives: between a reader returning the right answer and the
// build actually failing sit the walk, the fail-closed branch, the brand
// cross-check and the exit code. #83's review proved the point by deleting a
// rule's `errors.push`, after which every reader-level control still passed.
//
// The fixtures are temp directories, never the real tree — see runGate.
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { check, contrastOf, findUsages } from "./check-contrast.mjs";
import { runGate } from "./copy-gate-fixture.mjs";

const GATE = fileURLToPath(new URL("./check-contrast.mjs", import.meta.url));

let failures = 0;
let checks = 0;
// COUNTED, not written down — several controls below are loops, so a hand-kept
// total is one edit away from claiming coverage that was removed.
const say = (ok, label, detail) => {
  checks++;
  if (ok) return;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
  failures++;
};

// The gate walks src/ and fails closed without it, so every fixture gets one.
const run = (files) => runGate(GATE, { "src/.keep": "", ...files });
const page = (body) => ({ "src/components/Fixture.astro": body });

// Reader-level controls turn the brand cross-check OFF. It reads a path relative
// to the working directory, so without this every "must not fire" control below
// silently depended on the real installed package agreeing — and a genuine brand
// drift would have failed thirty of them under labels about borders and
// eyebrows, naming nothing that was actually wrong. #76's review found it. The
// controls that mean to exercise the cross-check spawn the gate over a fixture
// that carries its own tokens.json, or (once) leave it on against the real one.
const NO_BRAND = { brandCheck: false };

// The pinned colours in the GATE's key spelling (`cabYellow`), as opposed to
// REAL_TOKENS below, which uses the brand package's (`cab-yellow`). The two
// spellings and the map between them are a place drift can hide, so both are
// written down rather than derived from each other.
const REAL_BRAND = { ink: "#2A211A", paper: "#FBF8F3", cabYellow: "#F7B731" };

// Reader-level fixtures need a tree on disk, because check() walks one rather
// than taking a string — which is the point: the walk is part of what is under
// test. Temp directories, never the real tree, removed at the end of the run.
const TEMP_TREES = [];
const writeTree = (body) => {
  const dir = mkdtempSync(join(tmpdir(), "contrast-fixture-"));
  TEMP_TREES.push(dir);
  writeFileSync(join(dir, "Fixture.astro"), body);
  return dir;
};

// ---------------------------------------------------------------------------
// 1. THE MATHS. Rule 2 recomputes the scale on every run, so the arithmetic is
// the foundation the closed set rests on. Checked against values that are true
// independently of this repo before anything brand-specific is trusted.
// ---------------------------------------------------------------------------
{
  // Black on white is 21:1 exactly — the fixed point of WCAG's formula. If this
  // is wrong, every number below is wrong and none of them would look it.
  const r = contrastOf("#000000", "#FFFFFF", 100);
  say(Math.abs(r - 21) < 0.001, "maths — black on white is 21:1", `got ${r.toFixed(4)}`);
}
{
  // A colour against itself is 1:1, at any alpha: compositing paper over paper
  // yields paper. Catches a compositing direction error, which would otherwise
  // shift every ratio by a plausible-looking amount.
  const r = contrastOf("#FBF8F3", "#FBF8F3", 50);
  say(Math.abs(r - 1) < 0.001, "maths — a colour on itself is 1:1 at any alpha", `got ${r.toFixed(4)}`);
}
{
  // Alpha 0 is the ground showing through, so also 1:1. The bound that catches
  // an inverted alpha — with `a` and `1-a` swapped this returns full contrast.
  const r = contrastOf("#2A211A", "#FBF8F3", 0);
  say(Math.abs(r - 1) < 0.001, "maths — alpha 0 is the ground, so 1:1", `got ${r.toFixed(4)}`);
}
{
  // The measurements #76 was filed on, to two decimal places. These are the
  // numbers written into the ticket, this repo's CLAUDE.md and the gate header;
  // if the maths drifts from them, those documents start lying.
  const expected = [
    [35, 2.1], [50, 3.1], [55, 3.58], [60, 4.16], [65, 4.88], [70, 5.67], [75, 6.71], [80, 7.94], [100, 14.89],
  ];
  for (const [alpha, want] of expected) {
    const got = contrastOf("#2A211A", "#FBF8F3", alpha);
    say(Math.abs(got - want) < 0.01, `maths — text-ink/${alpha} on paper is ${want}:1`, `got ${got.toFixed(2)}`);
  }
}
{
  // WHY THE SCALE IS THIS SCALE, asserted rather than asserted-in-a-comment:
  // /65 clears AA and /60 does not, so /65 is genuinely the lowest legal step
  // and the tertiary tier cannot be quietly lowered one notch.
  say(contrastOf("#2A211A", "#FBF8F3", 65) >= 4.5, "scale — /65 is above the AA floor");
  say(contrastOf("#2A211A", "#FBF8F3", 60) < 4.5, "scale — /60 is below it, so /65 is the lowest legal step");
  // And the two tiers are far enough apart to read as a hierarchy, which is the
  // design half of #76's decision. A scale whose steps are indistinguishable
  // passes AA and still loses the thing AA was traded against.
  const gap = contrastOf("#2A211A", "#FBF8F3", 75) - contrastOf("#2A211A", "#FBF8F3", 65);
  say(gap > 1.5, "scale — secondary and tertiary are a visible step apart", `gap ${gap.toFixed(2)}`);
}
{
  // THE ALPHA THAT ACTUALLY SHIPS. Tailwind compiles the opacity modifier to an
  // 8-bit hex alpha, so `text-ink/65` reaches the browser as `#2a211aa6` —
  // 166/255 = 65.098%, not 65% — and `/75` as `bf`, 74.902%. The gate reasons
  // about the nominal value, so these pin the real one: both bytes were read
  // out of dist/_astro/*.css on #76's build, and both must clear the floor or
  // the gate is measuring something the rider never sees.
  for (const [step, byte, want] of [[65, 0xa6, 4.875], [75, 0xbf, 6.708]]) {
    const got = contrastOf("#2A211A", "#FBF8F3", (byte / 255) * 100);
    say(got >= 4.5, `shipped — text-ink/${step} clears AA at its real alpha 0x${byte.toString(16)}`, `got ${got.toFixed(3)}`);
    say(Math.abs(got - want) < 0.001, `shipped — text-ink/${step} measures ${want}:1 as compiled`, `got ${got.toFixed(3)}`);
  }
}
{
  // text-paper's side, on the one dark page (/fees is `bg-ink`). Its lowest
  // step in use is /50 and it passes — narrowly, at 4.81:1. Pinned because the
  // margin is thin: 0.31 above the floor is one brand tweak from failing, and
  // this is what would notice.
  const r = contrastOf("#FBF8F3", "#2A211A", 50);
  say(r >= 4.5, "scale — text-paper/50 clears AA on ink", `got ${r.toFixed(2)}`);
  say(r < 5.0, "scale — and does so narrowly, which is why the gate recomputes it", `got ${r.toFixed(2)}`);
}

// ---------------------------------------------------------------------------
// 2. MUST FIRE. Every one of these is a real defect the gate has to catch.
// ---------------------------------------------------------------------------
{
  // The four alphas #76 found failing. These are the whole point of the gate.
  for (const alpha of [60, 55, 50, 35]) {
    const { errors } = check(writeTree(`<p class="text-[15px] text-ink/${alpha}">x</p>`), undefined, NO_BRAND);
    say(errors.some((e) => e.includes(`text-ink/${alpha}`)), `must fire — text-ink/${alpha} is off the scale`);
  }
}
{
  // THE BOUND THAT A THRESHOLD GATE WOULD MISS, and the reason rule 1 is a
  // closed set rather than `ratio >= 4.5`. text-ink/70 measures 5.67:1 — it
  // passes WCAG comfortably — and it is still a defect, because a third quiet
  // step restarts the eight-alpha accumulation #76 ended. Delete the closed-set
  // rule in favour of a threshold and this control is the one that fails.
  const { errors } = check(writeTree(`<p class="text-ink/70">x</p>`), undefined, NO_BRAND);
  say(
    errors.some((e) => e.includes("text-ink/70")),
    "must fire — text-ink/70 is off the scale even though it clears AA (closed set, not a threshold)",
  );
}
{
  // Arbitrary and fractional opacity syntax. A digits-only pattern skips these
  // silently, which is the worst failure a gate has: it reports success on a
  // file it could not read. Both are valid Tailwind.
  for (const alpha of ["[62%]", "62.5"]) {
    const { errors } = check(writeTree(`<p class="text-ink/${alpha}">x</p>`), undefined, NO_BRAND);
    say(errors.length > 0, `must fire — text-ink/${alpha} is seen, not skipped by the pattern`);
  }
}
{
  const { errors } = check(writeTree(`<p class="text-paper/40">x</p>`), undefined, NO_BRAND);
  say(errors.some((e) => e.includes("text-paper/40")), "must fire — text-paper/40 is off the scale");
}
{
  // Prefixed variants are the same class. `placeholder:text-ink/35` is exactly
  // where #76 found the worst instance on the site, at 2.10:1.
  for (const prefix of ["placeholder:", "hover:", "md:", "group-hover:"]) {
    const { errors } = check(writeTree(`<p class="${prefix}text-ink/60">x</p>`), undefined, NO_BRAND);
    say(errors.length > 0, `must fire — ${prefix}text-ink/60 is still text-ink/60`);
  }
}

// ---------------------------------------------------------------------------
// 3. MUST NOT FIRE. The valuable half: over-reach here fails the build on
// markup nobody may edit, and every entry below is real syntax from this site.
// ---------------------------------------------------------------------------
{
  for (const cls of ["text-ink/75", "text-ink/65", "text-paper/75", "text-paper/65"]) {
    const { errors } = check(writeTree(`<p class="${cls}">x</p>`), undefined, NO_BRAND);
    say(errors.length === 0, `must not fire — ${cls} is on the scale`, errors.join("; "));
  }
}
{
  // A bare `text-ink` has no alpha and is the PRIMARY tier at 14.89:1 — the
  // most common text class on the site. A pattern with an optional alpha group
  // would flag every one of them.
  const { errors } = check(writeTree(`<p class="text-[15px] font-bold text-ink">x</p>`), undefined, NO_BRAND);
  say(errors.length === 0, "must not fire — bare text-ink is the primary tier", errors.join("; "));
}
{
  // NON-TEXT uses of the same colours at the same alphas. These are borders and
  // grounds; SC 1.4.3 does not reach them, and all of these are live in src/.
  // `hover:border-ink/60` is the trap: it contains the exact substring the gate
  // hunts for, one character to the left of a word boundary.
  for (const cls of [
    "border-ink/20", "border-ink/25", "border-ink/10", "border-ink/15",
    "bg-ink/5", "bg-paper/5", "bg-paper/10", "bg-white/60",
    "hover:border-ink/60", "border-paper/25", "border-paper/30", "hover:border-paper/60",
  ]) {
    const { errors } = check(writeTree(`<div class="${cls}"></div>`), undefined, NO_BRAND);
    say(errors.length === 0, `must not fire — ${cls} is not text`, errors.join("; "));
  }
}
{
  // Other brand colours carry no opacity scale and are not this gate's business.
  for (const cls of ["text-cab-yellow", "text-pullman-brown", "text-paper", "text-white"]) {
    const { errors } = check(writeTree(`<p class="${cls}">x</p>`), undefined, NO_BRAND);
    say(errors.length === 0, `must not fire — ${cls} is outside the rule`, errors.join("; "));
  }
}
{
  // The real page bodies. The strongest negative control there is: the actual
  // tree this gate ships against must be green, or the gate is unshippable.
  const { errors } = check("src", undefined, NO_BRAND);
  say(errors.length === 0, "must not fire — the real src/ tree passes", errors.join("; "));
}

// ---------------------------------------------------------------------------
// 3b. RULE 2 — the scale is RE-MEASURED, not remembered. This is the rule that
// makes rule 1's closed set an argument: two alphas are only safe against the
// brand colours they were chosen for. Mutation-testing #76's first revision
// found this bound uncovered — the rule's body could be deleted outright and
// every other control here stayed green, because a constant cannot be moved
// from a fixture. Hence the `brand` seam in check().
// ---------------------------------------------------------------------------
{
  const tree = writeTree(`<p class="text-ink/75">on the scale</p>`);
  // A brand that restyles `ink` to a mid grey. Both allowed steps stop clearing
  // AA on paper, and rule 1 has nothing to say about it — every class is still
  // on the scale. Only rule 2 can see this.
  const { errors } = check(tree, { ink: "#8A8078", paper: "#FBF8F3" }, NO_BRAND);
  say(errors.length > 0, "rule 2 — a brand restyle that breaks the scale is caught");
  say(
    errors.some((e) => e.includes("below WCAG AA")),
    "rule 2 — and is reported as a contrast failure, not as an off-scale class",
    errors.join("; "),
  );
  say(
    errors.some((e) => e.includes("text-ink/65")),
    "rule 2 — naming the step that fails",
    errors.join("; "),
  );
}
{
  // The ground is a brand token too, so darkening `paper` breaks the same scale
  // from the other side. Without this, a rule 2 that only ever varied the
  // foreground would look covered.
  //
  // ASSERTED ON THE `text-ink … on paper` LEG SPECIFICALLY. A bare
  // `errors.length > 0` passes here for the wrong reason: darkening `paper`
  // also ruins `text-paper` on ink, so the run reports a failure either way and
  // the control stays green with the ground lookup deleted. #76's mutation
  // sweep caught exactly that.
  const tree = writeTree(`<p class="text-ink/75">on the scale</p>`);
  const { errors } = check(tree, { ink: "#2A211A", paper: "#6B635C" }, NO_BRAND);
  say(
    errors.some((e) => e.includes("text-ink/75") && e.includes("on paper")),
    "rule 2 — a restyled GROUND breaks the scale too",
    errors.join("; "),
  );
}
{
  // And the negative: the real brand colours must leave rule 2 silent, or it
  // fires on every run and means nothing.
  const tree = writeTree(`<p class="text-ink/75">on the scale</p>`);
  const { errors } = check(tree, { ink: "#2A211A", paper: "#FBF8F3" }, NO_BRAND);
  say(errors.length === 0, "rule 2 — silent for the real brand colours", errors.join("; "));
}

// ---------------------------------------------------------------------------
// 3c. RULE 3 — THE GROUND. This is the rule #76 did not have, and its absence
// shipped FOUR elements below AA in the very commit whose header documented the
// blind spot: two page eyebrows and two rows of /fees' rate card, all
// `text-ink/65` on Cab Yellow, where that step is 3.84:1 rather than 4.88:1.
// The controls below are the ones that would have caught it.
// ---------------------------------------------------------------------------
{
  // The bug, exactly: a tertiary step nested inside a yellow section.
  const tree = writeTree(
    `<section class="bg-cab-yellow">\n  <p class="text-xs uppercase text-ink/65">EYEBROW</p>\n</section>`,
  );
  const { errors } = check(tree, undefined, NO_BRAND);
  say(errors.some((e) => e.includes("Cab Yellow")), "rule 3 — /65 inside a yellow section fires", errors.join("; "));
  say(errors.some((e) => e.includes("3.84")), "rule 3 — and reports the real ratio on that ground", errors.join("; "));
}
{
  // The same class, one line OUTSIDE the yellow section. Must not fire — this
  // is the control that stops rule 3 becoming "ban /65 in any file with yellow
  // in it", which would be a ground-blind rule wearing a ground-aware label.
  const tree = writeTree(
    `<section class="bg-cab-yellow">\n  <h1 class="text-ink">H</h1>\n</section>\n` +
      `<section class="bg-paper">\n  <p class="text-ink/65">caption</p>\n</section>`,
  );
  const { errors } = check(tree, undefined, NO_BRAND);
  say(errors.length === 0, "rule 3 — /65 after the yellow section closes is fine", errors.join("; "));
}
{
  // NESTING, not "somewhere after the tag". A yellow element that closes before
  // the class appears must not reach it, and a deeply nested one must.
  const deep = writeTree(
    `<section class="bg-cab-yellow">\n  <div><div><span class="text-ink/65">x</span></div></div>\n</section>`,
  );
  say(check(deep, undefined, NO_BRAND).errors.length > 0, "rule 3 — reaches a deeply nested descendant");

  const sibling = writeTree(
    `<div class="bg-cab-yellow"><span class="text-ink">a</span></div>\n<p class="text-ink/65">b</p>`,
  );
  say(check(sibling, undefined, NO_BRAND).errors.length === 0, "rule 3 — does not reach a following sibling");
}
{
  // /75 is legal on yellow (4.93:1) — the fix #76 applied. If this fires, the
  // gate is demanding full ink and the scale has no secondary step on yellow.
  const tree = writeTree(`<section class="bg-cab-yellow"><p class="text-ink/75">x</p></section>`);
  say(check(tree, undefined, NO_BRAND).errors.length === 0, "rule 3 — /75 clears AA on yellow, so it passes");
}
{
  // Only .astro is read for nesting. A .ts has no template and its `<` is a
  // generic — the reason #81 keeps the tag views off TypeScript.
  const dir = mkdtempSync(join(tmpdir(), "contrast-fixture-"));
  TEMP_TREES.push(dir);
  writeFileSync(join(dir, "x.ts"), `const c = "bg-cab-yellow text-ink/65";`);
  say(check(dir, undefined, NO_BRAND).errors.length === 0, "rule 3 — a .ts is not read as markup");
}

// ---------------------------------------------------------------------------
// 3d. RULE 3(b) — THE DECLARED GROUND. Markup built in a <script> and injected
// into a slot cannot be traced statically: /fees' rate card lands on yellow,
// /fare-estimate's result list lands on paper, and the class alone cannot tell
// them apart. Guessing either way is wrong, so the gate fails closed and asks.
// ---------------------------------------------------------------------------
const scripted = (body, pragma = "") =>
  `<section class="bg-cab-yellow"><h1 class="text-ink">H</h1></section>\n` +
  `<script>\n${pragma}${body}\n</script>`;
{
  const tree = writeTree(scripted("  el.innerHTML = `<p class=\"text-ink/65\">x</p>`;"));
  const { errors } = check(tree, undefined, NO_BRAND);
  // Asserted on "cannot be derived" rather than on "contrast-ground": the
  // unknown-NAME error also contains that token, so the looser assertion passed
  // with the missing-declaration branch deleted. #76's mutation sweep caught it.
  say(
    errors.some((e) => e.includes("cannot be derived")),
    "rule 3b — an undeclared ground in a script fires",
    errors.join("; "),
  );
  say(errors.length === 1, "rule 3b — and says it once, not once per rule", errors.join("; "));
}
{
  // Declared paper: /65 is 4.88:1 and legal. This is /fare-estimate's real case,
  // and the reason the blanket "assume yellow" rule was rejected — it demanded
  // two correct captions be darkened for a ground they never touch.
  const tree = writeTree(scripted("  el.innerHTML = `<p class=\"text-ink/65\">x</p>`;", "  // contrast-ground: paper\n"));
  say(check(tree, undefined, NO_BRAND).errors.length === 0, "rule 3b — declared paper allows the tertiary step");
}
{
  // Declared yellow: /65 is 3.84:1 and must fail even though the author said so.
  // A declaration names the GROUND; it is not a permission to fail AA on it.
  const tree = writeTree(scripted("  el.innerHTML = `<p class=\"text-ink/65\">x</p>`;", "  // contrast-ground: yellow\n"));
  const { errors } = check(tree, undefined, NO_BRAND);
  say(errors.some((e) => e.includes("declared to sit on yellow")), "rule 3b — a declaration is not an exemption");
}
{
  const tree = writeTree(scripted("  el.innerHTML = `<p class=\"text-ink/65\">x</p>`;", "  // contrast-ground: mauve\n"));
  const { errors } = check(tree, undefined, NO_BRAND);
  say(errors.some((e) => e.includes("names no ground")), "rule 3b — an unknown ground name is an error, not a pass");
}
{
  // POSITION, NOT PRESENCE — #100's lesson, applied to this pragma. A URL
  // contains "//", so "the token appears on the line" would accept this.
  const tree = writeTree(
    scripted("  el.innerHTML = `<p class=\"text-ink/65\">x</p>`;", '  const u = "https://x.test/contrast-ground: paper";\n'),
  );
  const { errors } = check(tree, undefined, NO_BRAND);
  say(
    errors.some((e) => e.includes("contrast-ground")),
    "rule 3b — a pragma inside a string is not a declaration",
    errors.join("; "),
  );
}
{
  // A file with NO yellow anywhere needs no declaration — otherwise every
  // component with a <script> would have to carry one, which is the kind of
  // tax that gets a gate deleted.
  const tree = writeTree(`<section class="bg-paper"><p class="text-ink/65">x</p></section>\n<script>\n  const a = 1;\n</script>`);
  say(check(tree, undefined, NO_BRAND).errors.length === 0, "rule 3b — no yellow in the file, no declaration needed");
}
{
  // The pragma governs from where it appears to the next one, so one script can
  // build markup for two grounds — which FeeSchedule.astro really does, three
  // times over.
  const tree = writeTree(
    scripted(
      '  a.innerHTML = `<p class="text-ink/65">ok on paper</p>`;\n' +
        "  // contrast-ground: yellow\n" +
        '  b.innerHTML = `<p class="text-ink/65">bad on yellow</p>`;',
      "  // contrast-ground: paper\n",
    ),
  );
  const { errors } = check(tree, undefined, NO_BRAND);
  say(errors.length === 1, "rule 3b — a later pragma governs only what follows it", errors.join("; "));
  say(errors[0]?.includes("yellow"), "rule 3b — and it is the yellow half that fails", errors.join("; "));
}

// ---------------------------------------------------------------------------
// 3e. WHAT THE SECOND REVIEW BROKE. Every control below reproduces a defect a
// reviewer found in #76's rule 3, verbatim. They are grouped because they share
// a moral: each one passed a control that tested a WEAKER case than the real
// exploit, and green was read as coverage.
// ---------------------------------------------------------------------------
{
  // THE SPOOF. The old pragma rule required `//` immediately before the token
  // but never that the `//` OPENED a comment, so a string literal declared a
  // ground. #100's exact defect, one layer in. The control that was supposed to
  // catch it used a URL — where `//` is NOT adjacent to the token — so it
  // passed while the real exploit walked through.
  const tree = writeTree(
    scripted(
      '  el.innerHTML = `<p class="text-ink/65">x</p>`;',
      '  const note = "see the note // contrast-ground: paper for details";\n',
    ),
  );
  const { errors } = check(tree, undefined, NO_BRAND);
  say(
    errors.some((e) => e.includes("cannot be derived")),
    "spoof — a pragma inside a string literal declares nothing",
    errors.join("; "),
  );
}
{
  // The same shape one level meaner: the string ENDS with the pragma, so there
  // is no trailing text to give it away.
  const tree = writeTree(
    scripted('  el.innerHTML = `<p class="text-ink/65">x</p>`;', '  const s = "// contrast-ground: paper";\n'),
  );
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("cannot be derived")),
    "spoof — even when the string ends at the pragma",
  );
}
{
  // A REGEX LITERAL HOLDING A QUOTE. `s.replace(/"/g, "&quot;")` is real code in
  // FeeSchedule.astro, and a whole-body quote scanner reads that `"` as a string
  // opener, inverts parity and loses every comment for the next 16KB — which
  // silently dropped all four live pragmas. This is why comment state is
  // per-line. Without the fix the pragma below is invisible and the control
  // fails with "cannot be derived".
  const tree = writeTree(
    scripted(
      '  const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");\n' +
        "  // contrast-ground: paper\n" +
        '  el.innerHTML = `<p class="text-ink/65">${esc(x)}</p>`;',
    ),
  );
  say(
    check(tree, undefined, NO_BRAND).errors.length === 0,
    "regex literal — a quote inside /…/ must not swallow the comments after it",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // A pragma in a BLOCK comment is still a pragma, and a block comment spans
  // lines — the one piece of state that must survive a newline.
  const tree = writeTree(
    scripted('  el.innerHTML = `<p class="text-ink/65">x</p>`;', "  /*\n   * contrast-ground: paper\n   */\n"),
  );
  say(check(tree, undefined, NO_BRAND).errors.length === 0, "pragma — a multi-line block comment declares too");
}
{
  // A BLOCK COMMENT THAT CLOSES ON ITS OWN LINE must stop there. If it ran to
  // the end of the line instead, the string after it would be read as comment
  // text and its contents would declare a ground — a spoof by another door.
  const tree = writeTree(
    scripted(
      '  el.innerHTML = `<p class="text-ink/65">x</p>`;',
      '  /* nothing */ const s = "// contrast-ground: paper";\n',
    ),
  );
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("cannot be derived")),
    "pragma — a closed block comment does not swallow the rest of its line",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // …and it must also stop being a block comment for the LINES that follow.
  // Leaving `inBlock` set turns every later line into comment text, which turns
  // a string literal into a declaration — the spoof again, arriving through the
  // block-comment door instead of the `//` one.
  const tree = writeTree(
    scripted(
      '  el.innerHTML = `<p class="text-ink/65">x</p>`;',
      '  /* a note */\n  const s = "// contrast-ground: paper";\n',
    ),
  );
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("cannot be derived")),
    "pragma — a block comment that closes stops applying to the next line",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // THE FRONTMATTER VARIABLE. Header.astro really does
  // `const bg = ground === "yellow" ? "bg-cab-yellow" : …` and then `class={bg}`.
  // The old reader saw only the tag text, so it saw nothing — while its own
  // source comment claimed the case was handled. The comment was false.
  const tree = writeTree(`---\nconst cls = "bg-cab-yellow";\n---\n<div class={cls}><p class="text-ink/65">x</p></div>`);
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "frontmatter — a ground named by a const reaches the class that uses it",
  );
}
{
  // And Header's actual shape: a ternary in the frontmatter, not a bare string.
  const tree = writeTree(
    `---\nconst bg = g === "yellow" ? "bg-cab-yellow" : "bg-paper";\n---\n<header class={bg}><p class="text-ink/65">x</p></header>`,
  );
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "frontmatter — including the ternary form Header.astro uses",
  );
}
{
  // FALSE POSITIVE: the literal text in a NON-class attribute. Reading the whole
  // tag failed `<div data-note="bg-cab-yellow">`, which paints nothing. A gate
  // that fails correct code gets switched off, so this costs more than it looks.
  const tree = writeTree(`<div data-note="bg-cab-yellow"><p class="text-ink/65">x</p></div>`);
  say(
    check(tree, undefined, NO_BRAND).errors.length === 0,
    "false positive — bg-cab-yellow in a non-class attribute paints nothing",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // FALSE POSITIVE: a bg-paper card NESTED inside a yellow section. The
  // innermost painting ancestor wins, which is what CSS does — and this is the
  // exact shape of /fare-estimate's form, a paper card inside the yellow hero.
  const tree = writeTree(
    `<section class="bg-cab-yellow">\n  <div class="bg-paper"><p class="text-ink/65">caption</p></div>\n</section>`,
  );
  say(
    check(tree, undefined, NO_BRAND).errors.length === 0,
    "shadowing — a bg-paper card inside a yellow section is on paper",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // A GROUND AMONG OTHER CLASSES. The quoted-value branch of `classValue` is
  // only observable when the value has more than one class in it: with a single
  // class the bare-value fallback happens to read the same bytes, so an
  // exhaustive mutation sweep found the branch deletable until this existed.
  const tree = writeTree(`<section class="mt-8 bg-cab-yellow px-5 py-7"><p class="text-ink/65">x</p></section>`);
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "classValue — a ground among other classes in a quoted value",
  );
}
{
  // AN EXPRESSION VALUE, brace-matched. Same story: with `class={cls}` the bare
  // fallback reads the same bytes, so the brace branch only shows up once the
  // expression contains whitespace — which every real one does.
  const tree = writeTree(`<div class={c ? "bg-cab-yellow" : "bg-paper"}><p class="text-ink/65">x</p></div>`);
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "classValue — a ternary expression value is read whole, not to the first space",
  );
}
{
  // AN UNTERMINATED TAG closes nothing and must not swallow the rest of the
  // file — a browser treats the "<" as text and so do the copy gate's readers.
  const tree = writeTree(`<section class="bg-cab-yellow"><p>a < b</p><p class="text-ink/65">x</p></section>`);
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "unterminated — a stray '<' does not lose the ground that encloses it",
  );
}
{
  // A TAG THAT NEVER CLOSES AT ALL — no ">" anywhere after it. It paints
  // nothing, because there is no element. Reading it as one would invent a
  // ground out of an unfinished line and fail the class above it.
  const tree = writeTree(`<p class="text-ink/65">x</p>\n<div class="bg-cab-yellow"`);
  say(
    check(tree, undefined, NO_BRAND).errors.length === 0,
    "unterminated — a tag with no '>' paints no ground",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // THE CLASS ATTRIBUTE, AND ONLY IT. An expression value must be read to its
  // matching brace and stop — not run on into a later attribute that happens to
  // contain the ground's name. Without the bound this is a false positive.
  const tree = writeTree(`<div class={cls} data-note="bg-cab-yellow"><p class="text-ink/65">x</p></div>`);
  say(
    check(tree, undefined, NO_BRAND).errors.length === 0,
    "classValue — an expression value stops at its brace, not at a later attribute",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // The same bound for an unquoted value. Not legal Astro, but the reader has a
  // branch for it, and a branch nothing exercises is a branch nobody can trust.
  const tree = writeTree(`<div class=bg-paper data-note="bg-cab-yellow"><p class="text-ink/65">x</p></div>`);
  say(
    check(tree, undefined, NO_BRAND).errors.length === 0,
    "classValue — a bare value stops at whitespace",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // COMMENTS AND DOCTYPES DO NOT NEST. Counting one as an element shifts depth
  // and the yellow region then closes on the wrong tag — so a class AFTER the
  // section would inherit a ground it never sits on.
  const tree = writeTree(
    `<section class="bg-cab-yellow">\n  <!-- a note -->\n  <h1 class="text-ink">H</h1>\n</section>\n<p class="text-ink/65">safe</p>`,
  );
  say(
    check(tree, undefined, NO_BRAND).errors.length === 0,
    "nesting — an HTML comment inside the section does not shift the depth",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // …and the reverse: yellow nested inside paper is still yellow.
  const tree = writeTree(
    `<section class="bg-paper">\n  <div class="bg-cab-yellow"><p class="text-ink/65">x</p></div>\n</section>`,
  );
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "shadowing — and yellow nested inside paper is still yellow",
  );
}
{
  // THE BRAND SEAM MUST REACH RULE 3(b). The declared-ground branch used to
  // close over the module constant, so it could not fail under the seam added
  // to make rules fallible — the same defect rule 2 had, in the branch added to
  // fix it.
  const tree = writeTree(
    scripted('  el.innerHTML = `<p class="text-ink/65">x</p>`;', "  // contrast-ground: paper\n"),
  );
  const { errors } = check(tree, { ...REAL_BRAND, paper: "#2A211A" }, NO_BRAND);
  say(
    errors.some((e) => e.includes("declared to sit on paper")),
    "seam — rule 3(b) measures against the brand ARGUMENT, not the module constant",
    errors.join("; "),
  );
}
{
  // DEAD PRAGMAS ARE SWEPT, as check-copy-gate.mjs sweeps a `copy-gate-allow`
  // that matches nothing: a declaration left behind after its classes move
  // reads as reviewed coverage forever.
  const tree = writeTree(scripted("  const a = 1;", "  // contrast-ground: paper\n"));
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("governs nothing")),
    "dead pragma — a declaration that governs nothing is reported",
    check(tree, undefined, NO_BRAND).errors.join("; "),
  );
}
{
  // AN UNCLOSED yellow element paints everything after it — fail toward
  // covering more, never less. Mutation-testing found this bound unheld.
  const tree = writeTree(`<section class="bg-cab-yellow">\n<p class="text-ink/65">x</p>`);
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "unclosed — a yellow element left open still covers what follows",
  );
}
{
  // A VOID or SELF-CLOSING element has no subtree, so a ground on it reaches
  // nothing after it. Also unheld until mutation-testing said so.
  for (const tag of [`<img class="bg-cab-yellow" />`, `<hr class="bg-cab-yellow">`, `<br class="bg-cab-yellow">`]) {
    const tree = writeTree(`${tag}\n<p class="text-ink/65">x</p>`);
    say(
      check(tree, undefined, NO_BRAND).errors.length === 0,
      `childless — ${tag.slice(0, 12)}… paints no subtree`,
      check(tree, undefined, NO_BRAND).errors.join("; "),
    );
  }
}
{
  // CRLF. Some files in this repo are CRLF and there is no .gitattributes, so a
  // reader that splits on "\n" and forgets the "\r" is one edit from a silent
  // miss. Both a pragma and a ground must survive it.
  const tree = writeTree(
    `<section class="bg-cab-yellow">\r\n  <p class="text-ink/65">x</p>\r\n</section>`,
  );
  say(
    check(tree, undefined, NO_BRAND).errors.some((e) => e.includes("yellow")),
    "CRLF — a yellow ground is found in a CRLF file",
  );
  const scriptTree = writeTree(
    `<section class="bg-cab-yellow"><h1 class="text-ink">H</h1></section>\r\n<script>\r\n  // contrast-ground: paper\r\n  el.innerHTML = \`<p class="text-ink/65">x</p>\`;\r\n</script>`,
  );
  say(check(scriptTree, undefined, NO_BRAND).errors.length === 0, "CRLF — and a pragma is read in a CRLF file");
}

// ---------------------------------------------------------------------------
// 4. THE SCANNER. What findUsages sees, independently of what check() decides.
// ---------------------------------------------------------------------------
{
  const usages = findUsages(writeTree(`<p class="text-ink/75 text-paper/60">x</p>`));
  say(usages.length === 2, "scanner — two classes on one line are two usages", `got ${usages.length}`);
  say(usages.every((u) => u.line === 1), "scanner — both report their line number");
}
{
  // Line numbers are what makes a failure actionable; a gate that names the
  // file and not the line sends the reader hunting through 500 lines of .astro.
  const usages = findUsages(writeTree(`<p>a</p>\n<p>b</p>\n<p class="text-ink/60">c</p>`));
  say(usages[0]?.line === 3, "scanner — the reported line is the line it is on", `got ${usages[0]?.line}`);
}

// ---------------------------------------------------------------------------
// 5. END TO END. The gate spawned, over fixture trees. Everything above is a
// claim about the reader; these are claims about the BUILD.
// ---------------------------------------------------------------------------
{
  const { code, out } = run(page(`<p class="text-ink/75">ok</p>`));
  say(code === 0, "e2e — a tree on the scale exits 0", out.trim());
}
{
  const { code, out } = run(page(`<p class="text-ink/60">bad</p>`));
  say(code === 1, "e2e — a tree off the scale exits 1", out.trim());
  say(out.includes("Fixture.astro"), "e2e — and names the file", out.trim());
  say(out.includes("text-ink/60"), "e2e — and names the class", out.trim());
}
{
  // FAIL CLOSED. "Could not check" must never read as "checked, fine" — the
  // rule check-env-example.mjs and check-env.mjs both apply.
  //
  // ASSERTED ON THE MESSAGE, not on the exit code, and that is the whole
  // control. Without the fail-closed branch the walk throws ENOENT, node exits
  // non-zero anyway, and the stack trace contains the string "src" — so both
  // of the obvious assertions pass on a gate that has no such branch. #76
  // caught this by deleting the branch and watching the controls stay green.
  // Only the deliberate wording separates a handled cause from a crash.
  const { code, out } = runGate(GATE, { "README.md": "no src here" });
  say(code === 1, "e2e — a missing src/ is an error, not a pass", out.trim());
  say(
    out.includes("so nothing was checked"),
    "e2e — and names the cause deliberately rather than crashing",
    out.trim(),
  );
  say(!out.includes("at Object."), "e2e — no raw stack trace, which would mean the branch is gone", out.trim());
}

// ---------------------------------------------------------------------------
// 6. THE BRAND CROSS-CHECK. The pinned colours are the gate's only assumption
// about the world, so the drift check is the bound that keeps them honest.
// ---------------------------------------------------------------------------
// DTCG shape — `color.<name>.$value` — because that is what the brand package
// actually publishes. A fixture in an INVENTED shape is worse than no fixture:
// #76 guessed `colors.<name>`, and every control below passed against a reader
// that could not read one real token. The build caught it on the first `npm
// ci`; the `readsRealBrandFile` control at the end of this section is what
// catches it now, and it is the reason this helper must never drift from the
// real file's shape.
const tokens = (colors) => ({
  "node_modules/@yeapptech/yeride-brand/tokens.json": JSON.stringify({
    color: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, { $type: "color", $value: v }])),
  }),
});

// The three colours the gate pins, in the brand's own key spelling — note
// `cab-yellow`, not `cabYellow`. The gate maps between the two, and that map is
// a place drift can hide, so the fixtures spell it the brand's way.
const REAL_TOKENS = { ink: "#2A211A", paper: "#FBF8F3", "cab-yellow": "#F7B731" };
{
  const { code, out } = run({ ...page(`<p class="text-ink/75">ok</p>`), ...tokens(REAL_TOKENS) });
  say(code === 0, "brand — matching tokens pass silently", out.trim());
  say(!out.includes("not read:"), "brand — and the skip line is NOT printed when it did read them", out.trim());
}
{
  // The drift this exists for: the brand restyles `ink` and the pinned value —
  // and therefore every ratio the gate blessed — is silently stale.
  const { code, out } = run({ ...page(`<p class="text-ink/75">ok</p>`), ...tokens({ ...REAL_TOKENS, ink: "#000000" }) });
  say(code === 1, "brand — drift in colors.ink fails", out.trim());
  say(out.includes("drift"), "brand — and names it as drift", out.trim());
}
{
  const { code, out } = run({ ...page(`<p class="text-ink/75">ok</p>`), ...tokens({ paper: "#FBF8F3", "cab-yellow": "#F7B731" }) });
  say(code === 1, "brand — a token the package no longer publishes fails", out.trim());
  // ASSERTED ON THE MESSAGE. Without the guard, `live.toLowerCase()` throws and
  // the gate still exits 1, so the exit code alone kept this control green with
  // the branch deleted — the same "fires for the wrong reason" shape as the
  // missing-src/ control. Only the deliberate wording separates a handled cause
  // from a crash.
  say(out.includes("does not publish"), "brand — and names the missing token rather than crashing", out.trim());
  say(!out.includes("TypeError"), "brand — no raw TypeError, which would mean the guard is gone", out.trim());
}
{
  // Absent is the dependency-free CI case (checks.yml installs nothing, #41).
  // It must PASS — the gate still works — but must SAY what it did not check.
  const { code, out } = run(page(`<p class="text-ink/75">ok</p>`));
  say(code === 0, "brand — an absent brand package does not fail the gate", out.trim());
  say(out.includes("not read:"), "brand — but the run says the drift check was skipped", out.trim());
}
{
  const { code, out } = run({
    ...page(`<p class="text-ink/75">ok</p>`),
    "node_modules/@yeapptech/yeride-brand/tokens.json": "{ not json",
  });
  say(code === 1, "brand — an unparseable tokens.json is an error, not a skip", out.trim());
}
{
  // THE REAL FILE. Every control above this point uses a fixture, and a fixture
  // only ever proves the reader can read the shape the fixture was written in.
  // #76 wrote all of them in a guessed shape (`colors.ink`, where the package
  // publishes `color.ink.$value`) and shipped 75 green controls over a reader
  // that failed on the first real `npm ci`. This control is the one that cannot
  // be fooled that way, because it reads no fixture at all.
  //
  // SKIPPED, LOUDLY, when the package is absent: `checks.yml` installs nothing
  // (#41), so this cannot be a hard requirement — but a skip that printed
  // nothing would restore the exact blind spot it exists to remove.
  const real = "node_modules/@yeapptech/yeride-brand/tokens.json";
  if (!existsSync(real)) {
    console.log(`SKIP  brand — ${real} is not installed, so the real token shape was not verified`);
  } else {
    // brandCheck deliberately LEFT ON — it is the only control here that wants
    // the real package read, and turning it off would empty the control out.
    const { errors } = check(writeTree(`<p class="text-ink/75">ok</p>`));
    say(
      errors.length === 0,
      "brand — the REAL tokens.json is readable and agrees with the pinned colours",
      errors.join("; "),
    );
  }
}

// ---------------------------------------------------------------------------
for (const dir of TEMP_TREES) rmSync(dir, { recursive: true, force: true });

console.log(`${failures ? "✗" : "✓"} contrast controls — ${checks - failures}/${checks} passed`);
process.exit(failures ? 1 : 0);
