// Every quiet text colour on the site clears WCAG AA. Wayfinder #76.
//
// WHY THIS EXISTS. The site writes secondary prose by fading `ink` with a
// Tailwind opacity modifier — `text-ink/60` and friends. Nobody designed those
// alphas as a scale; they arrived one page at a time, and by #76 there were
// EIGHT of them (35/50/55/60/65/70/75/80). Four were below WCAG 2.1 SC 1.4.3's
// 4.5:1 for normal text: `text-ink/60` measures 4.16:1 on paper, `/55` 3.58:1,
// `/50` 3.10:1, and the form placeholder `/35` 2.10:1. Twenty-four elements
// were affected, including /fare-estimate's "Estimates are estimates — the
// meter decides." — a disclosure whose entire purpose is that riders read it.
//
// The failure had been found and re-found three times before #76 fixed it, and
// every time it was found by a human looking at a page. Nothing measured it, so
// nothing stopped the next `text-ink/60` from being typed. This does.
//
// WHAT IT ENFORCES. #76 replaced the eight alphas with a two-step scale:
//
//     text-ink        14.89:1   primary — the claim itself
//     text-ink/75      6.71:1   secondary — prose, links, disclosures
//     text-ink/65      4.88:1   tertiary — captions, eyebrow labels, meta
//
// So the rule is a CLOSED SET, not a threshold: an `ink` text alpha is `/75` or
// `/65` or it is a defect. That is deliberately stricter than "must clear
// 4.5:1", because `/66` would pass a threshold check and quietly restart the
// accumulation the scale exists to end. A new step is a design decision, and a
// design decision should cost an edit to this file.
//
// The maths is then checked SEPARATELY (rule 2) rather than assumed: the two
// allowed steps are recomputed from the brand colours on every run. If the
// brand ever restyles `ink` or `paper`, the closed set stops being safe and
// this says so, instead of blessing two numbers that no longer clear AA.
//
// WHY IT IS DEPENDENCY-FREE. `checks.yml` installs nothing (#41), so this reads
// files and does arithmetic and imports nothing. The brand colours are pinned
// as literals below AND cross-checked against the brand package when it happens
// to be installed — see `crossCheckBrand`. That gets the drift check without
// making the gate need `npm ci` to run at all.
//
// WHAT IT CANNOT SEE. It reads the class, not the rendered pixel, so it assumes
// each foreground sits on its documented ground: `text-ink` on `paper` (or
// white, which is checked too and is marginally kinder), `text-paper` on `ink`.
// That covers every page today — /fees is the only `bg-ink` page and everything
// else is `bg-paper` — but a `text-ink/65` placed on Cab Yellow, or a
// `text-paper/50` moved inside /fees' `bg-paper/5` error box (4.45:1, below the
// floor), would pass here and fail in a browser. Grounds are not derivable from
// a class list; a real answer needs the rendered page. This gate is the cheap
// authorship-time backstop, and that limit is the price of it being cheap.
//
// It also says nothing about SC 1.4.11 (3:1 for the boundaries of UI
// components). `border-ink/20` on the pre-registration inputs measures 1.49:1
// and is a real open question — a different success criterion, deliberately not
// smuggled in here. See #76's resolution comment.
//
// ONE MORE GAP, small and worth writing down rather than discovering twice: the
// alpha this gate reasons about is not exactly the alpha the browser paints.
// Tailwind compiles `text-ink/65` to an 8-bit hex alpha — `#2a211aa6`, which is
// 166/255 = 65.098%, not 65% — and `/75` to `bf`, 74.902%. So the true shipped
// ratios are 4.875:1 and 6.708:1 rather than the 4.88 and 6.71 quoted above.
// Both still clear AA, the drift is under a hundredth of a ratio point, and the
// controls pin the shipped values as well as the nominal ones. It would only
// matter for a step chosen to sit within 0.01 of the floor — which is a reason
// not to choose one.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Brand colours, pinned. Mirrored from @yeapptech/yeride-brand tokens.json,
// which `crossCheckBrand` re-reads whenever the package is installed.
// ---------------------------------------------------------------------------
const BRAND = {
  ink: "#2A211A",
  paper: "#FBF8F3",
};

// White, for the one ground that is not a brand token: the pre-registration
// inputs are `bg-white`. It is checked because `text-ink/N` appears on it.
const WHITE = "#FFFFFF";

// WCAG 2.1 SC 1.4.3, normal text. The large-text exemption (18.66px bold /
// 24px) is NOT used: every faded string on this site is 11–17px, so nothing
// qualifies, and a gate that offered the exemption would need to parse sizes it
// cannot reliably see.
const AA_NORMAL = 4.5;

// The scale. A change here is a design change — see the header.
const ALLOWED = {
  ink: [75, 65],
  paper: [70, 60, 50],
};

// Which ground each foreground is assumed to sit on. See "WHAT IT CANNOT SEE".
const GROUNDS = {
  ink: [
    ["paper", BRAND.paper],
    ["white", WHITE],
  ],
  paper: [["ink", BRAND.ink]],
};

const SRC = "src";

// ---------------------------------------------------------------------------
// Colour maths — WCAG 2.1 relative luminance and contrast ratio.
// ---------------------------------------------------------------------------
const parseHex = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a 6-digit hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
};

const channelLuminance = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = ([r, g, b]) =>
  0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);

const contrast = (fg, bg) => {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

// A Tailwind opacity modifier is alpha compositing, not a colour: the browser
// paints `rgb(ink / 0.65)` over whatever is behind it. So the effective text
// colour is the blend, and THAT is what contrast is measured against the ground
// it was blended with. Compositing is done in sRGB space, which is where the
// browser does it.
//
// ROUNDED to 8 bits on purpose. The pixel that reaches the screen — and that a
// contrast checker samples — is quantised, so the ratio of the quantised colour
// is the true one. Skipping the rounding shifts the numbers in the second
// decimal (`/65` reads 4.86 rather than 4.88), which is enough to disagree with
// #76's published table, this file's header and the failure footer. None of
// those differences crosses the AA floor today, and a number that is nearly
// right in four documents is worse than one that is right in all of them.
const composite = (fgHex, bgHex, alphaPercent) => {
  const fg = parseHex(fgHex);
  const bg = parseHex(bgHex);
  const a = alphaPercent / 100;
  return fg.map((v, i) => Math.round(a * v + (1 - a) * bg[i]));
};

export const contrastOf = (fgHex, bgHex, alphaPercent) =>
  contrast(composite(fgHex, bgHex, alphaPercent), parseHex(bgHex));

// ---------------------------------------------------------------------------
// The scan.
// ---------------------------------------------------------------------------

// `text-<colour>/<alpha>`, with the alpha captured however it is written, so an
// arbitrary or fractional value (`text-ink/[62%]`, `text-ink/62.5`) is SEEN and
// reported rather than silently skipped by a digits-only pattern. A rule that
// cannot see a violation is worse than no rule.
const CLASS_RE = /\btext-(ink|paper)\/(\[?[0-9a-z.%]+\]?)/gi;

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
};

export const findUsages = (root) => {
  const usages = [];
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(CLASS_RE)) {
        usages.push({ file, line: i + 1, colour: m[1].toLowerCase(), alpha: m[2], text: m[0] });
      }
    });
  }
  return usages;
};

// ---------------------------------------------------------------------------
// Rule 2's drift check: the pinned colours against the brand package, when the
// brand package is there. Absent (a dependency-free CI run), this prints what
// it skipped — "could not check" must never read as "checked, fine".
// ---------------------------------------------------------------------------
const crossCheckBrand = (errors, notes) => {
  const tokens = "node_modules/@yeapptech/yeride-brand/tokens.json";
  if (!existsSync(tokens)) {
    notes.push(`not read: ${tokens} (not installed) — pinned brand colours were not drift-checked`);
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(tokens, "utf8"));
  } catch (e) {
    errors.push(`${tokens} could not be parsed: ${e.message}`);
    return;
  }
  // tokens.json is DTCG: `color.<name>.$value`, not `colors.<name>`. Worth
  // pinning in a comment because #76 guessed the shape, wrote fixtures in the
  // guessed shape, and got 75 green controls over a reader that could not read
  // the real file — the mistake only surfaced on the first `npm ci` build.
  // `readsRealBrandFile` in contrast.test.mjs is the control that now closes it.
  for (const [name, pinned] of Object.entries(BRAND)) {
    const live = parsed?.color?.[name]?.$value;
    if (!live) {
      errors.push(
        `${tokens} does not publish color.${name}.$value — the pinned ${pinned} cannot be trusted. ` +
          `If the token file changed shape, fix crossCheckBrand rather than deleting it.`,
      );
    } else if (live.toLowerCase() !== pinned.toLowerCase()) {
      errors.push(
        `brand colour drift: color.${name} is ${live} in the brand package, pinned as ${pinned} here. ` +
          `Update BRAND in this file, then re-check the scale — the allowed steps are only safe for the pinned values.`,
      );
    }
  }
};

// ---------------------------------------------------------------------------
// `brand` is a seam, not a feature: rule 2 only ever fires when the brand
// colours move, and a constant cannot be moved from a fixture, so without it
// the rule is unfallible-by-construction — deleting its body left every control
// green when #76 mutation-tested this file. Production always passes BRAND.
export const check = (root = SRC, brand = BRAND) => {
  const errors = [];
  const notes = [];

  // RULE 1 — every usage is on the scale.
  for (const u of findUsages(root)) {
    const allowed = ALLOWED[u.colour];
    const alpha = Number(u.alpha);
    if (!Number.isFinite(alpha) || !allowed.includes(alpha)) {
      errors.push(
        `${u.file}:${u.line} — \`${u.text}\` is not on the scale. ` +
          `Allowed for ${u.colour}: ${allowed.map((a) => `text-${u.colour}/${a}`).join(", ")}.`,
      );
    }
  }

  // RULE 2 — the scale itself still clears AA against the brand colours. This
  // is what makes rule 1's closed set an argument rather than a habit.
  for (const [colour, alphas] of Object.entries(ALLOWED)) {
    for (const alpha of alphas) {
      for (const [groundName, groundHexPinned] of GROUNDS[colour]) {
        // The ground is a brand colour whenever it is one, so a restyle moves
        // both sides of the comparison — `text-ink` on `paper` is two tokens.
        const groundHex = brand[groundName] ?? groundHexPinned;
        const ratio = contrastOf(brand[colour], groundHex, alpha);
        if (ratio < AA_NORMAL) {
          errors.push(
            `text-${colour}/${alpha} measures ${ratio.toFixed(2)}:1 on ${groundName}, below WCAG AA's ${AA_NORMAL}:1. ` +
              `The scale is no longer safe for the current brand colours — raise the step or change the ground.`,
          );
        }
      }
    }
  }

  crossCheckBrand(errors, notes);
  return { errors, notes };
};

// ---------------------------------------------------------------------------
const isMain = process.argv[1] && process.argv[1].endsWith("check-contrast.mjs");
if (isMain) {
  // Fail closed, like check-env-example.mjs: a missing src/ is not a pass.
  if (!existsSync(SRC)) {
    console.error(`✗ contrast — ${SRC}/ is missing, so nothing was checked`);
    process.exit(1);
  }

  const { errors, notes } = check(SRC);
  for (const note of notes) console.log(`  ${note}`);

  if (errors.length) {
    console.error(`✗ contrast — ${errors.length} problem${errors.length === 1 ? "" : "s"}`);
    for (const e of errors) console.error(`  ${e}`);
    console.error("");
    console.error("  The scale (wayfinder #76), on paper:");
    console.error("    text-ink      14.89:1  primary — the claim itself");
    console.error("    text-ink/75    6.71:1  secondary — prose, links, disclosures");
    console.error("    text-ink/65    4.88:1  tertiary — captions, eyebrow labels, meta");
    console.error("  A new step is a design decision. Change ALLOWED in scripts/check-contrast.mjs on purpose.");
    process.exit(1);
  }

  console.log("✓ contrast — every text-ink/text-paper alpha is on the scale and clears WCAG AA");
}
