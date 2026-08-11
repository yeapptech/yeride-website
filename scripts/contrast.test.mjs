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
    const { errors } = check(writeTree(`<p class="text-[15px] text-ink/${alpha}">x</p>`));
    say(errors.some((e) => e.includes(`text-ink/${alpha}`)), `must fire — text-ink/${alpha} is off the scale`);
  }
}
{
  // THE BOUND THAT A THRESHOLD GATE WOULD MISS, and the reason rule 1 is a
  // closed set rather than `ratio >= 4.5`. text-ink/70 measures 5.67:1 — it
  // passes WCAG comfortably — and it is still a defect, because a third quiet
  // step restarts the eight-alpha accumulation #76 ended. Delete the closed-set
  // rule in favour of a threshold and this control is the one that fails.
  const { errors } = check(writeTree(`<p class="text-ink/70">x</p>`));
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
    const { errors } = check(writeTree(`<p class="text-ink/${alpha}">x</p>`));
    say(errors.length > 0, `must fire — text-ink/${alpha} is seen, not skipped by the pattern`);
  }
}
{
  const { errors } = check(writeTree(`<p class="text-paper/40">x</p>`));
  say(errors.some((e) => e.includes("text-paper/40")), "must fire — text-paper/40 is off the scale");
}
{
  // Prefixed variants are the same class. `placeholder:text-ink/35` is exactly
  // where #76 found the worst instance on the site, at 2.10:1.
  for (const prefix of ["placeholder:", "hover:", "md:", "group-hover:"]) {
    const { errors } = check(writeTree(`<p class="${prefix}text-ink/60">x</p>`));
    say(errors.length > 0, `must fire — ${prefix}text-ink/60 is still text-ink/60`);
  }
}

// ---------------------------------------------------------------------------
// 3. MUST NOT FIRE. The valuable half: over-reach here fails the build on
// markup nobody may edit, and every entry below is real syntax from this site.
// ---------------------------------------------------------------------------
{
  for (const cls of ["text-ink/75", "text-ink/65", "text-paper/70", "text-paper/60", "text-paper/50"]) {
    const { errors } = check(writeTree(`<p class="${cls}">x</p>`));
    say(errors.length === 0, `must not fire — ${cls} is on the scale`, errors.join("; "));
  }
}
{
  // A bare `text-ink` has no alpha and is the PRIMARY tier at 14.89:1 — the
  // most common text class on the site. A pattern with an optional alpha group
  // would flag every one of them.
  const { errors } = check(writeTree(`<p class="text-[15px] font-bold text-ink">x</p>`));
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
    const { errors } = check(writeTree(`<div class="${cls}"></div>`));
    say(errors.length === 0, `must not fire — ${cls} is not text`, errors.join("; "));
  }
}
{
  // Other brand colours carry no opacity scale and are not this gate's business.
  for (const cls of ["text-cab-yellow", "text-pullman-brown", "text-paper", "text-white"]) {
    const { errors } = check(writeTree(`<p class="${cls}">x</p>`));
    say(errors.length === 0, `must not fire — ${cls} is outside the rule`, errors.join("; "));
  }
}
{
  // The real page bodies. The strongest negative control there is: the actual
  // tree this gate ships against must be green, or the gate is unshippable.
  const { errors } = check("src");
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
  const { errors } = check(tree, { ink: "#8A8078", paper: "#FBF8F3" });
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
  const { errors } = check(tree, { ink: "#2A211A", paper: "#6B635C" });
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
  const { errors } = check(tree, { ink: "#2A211A", paper: "#FBF8F3" });
  say(errors.length === 0, "rule 2 — silent for the real brand colours", errors.join("; "));
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
{
  const { code, out } = run({ ...page(`<p class="text-ink/75">ok</p>`), ...tokens({ ink: "#2A211A", paper: "#FBF8F3" }) });
  say(code === 0, "brand — matching tokens pass silently", out.trim());
  say(!out.includes("not read:"), "brand — and the skip line is NOT printed when it did read them", out.trim());
}
{
  // The drift this exists for: the brand restyles `ink` and the pinned value —
  // and therefore every ratio the gate blessed — is silently stale.
  const { code, out } = run({ ...page(`<p class="text-ink/75">ok</p>`), ...tokens({ ink: "#000000", paper: "#FBF8F3" }) });
  say(code === 1, "brand — drift in colors.ink fails", out.trim());
  say(out.includes("drift"), "brand — and names it as drift", out.trim());
}
{
  const { code, out } = run({ ...page(`<p class="text-ink/75">ok</p>`), ...tokens({ paper: "#FBF8F3" }) });
  say(code === 1, "brand — a token the package no longer publishes fails", out.trim());
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
