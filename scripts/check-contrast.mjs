// Every quiet text colour on the site clears WCAG AA. Wayfinder #76.
//
// WHY THIS EXISTS. The site writes secondary prose by fading `ink` (or `paper`,
// on the dark pages) with a Tailwind opacity modifier — `text-ink/60` and
// friends. Nobody designed those alphas as a scale; they arrived one page at a
// time, and by #76 there were EIGHT of them (35/50/55/60/65/70/75/80). Four
// were below WCAG 2.1 SC 1.4.3's 4.5:1 for normal text: `text-ink/60` measures
// 4.16:1 on paper, `/55` 3.58:1, `/50` 3.10:1, and the form placeholder `/35`
// 2.10:1. Twenty-four elements were affected, including /fare-estimate's
// "Estimates are estimates — the meter decides." — a disclosure whose entire
// purpose is that riders read it.
//
// The failure had been found and re-found three times before #76 fixed it, and
// every time it was found by a human looking at a page. Nothing measured it, so
// nothing stopped the next `text-ink/60` from being typed. This does.
//
// WHAT IT ENFORCES. #76 replaced the eight alphas with a two-step scale, and
// the same two steps serve both foreground colours:
//
//     on paper (light pages)          on ink (/fees)
//     text-ink       14.89:1          text-paper      14.89:1   primary
//     text-ink/75     6.71:1          text-paper/75    8.93:1   secondary
//     text-ink/65     4.88:1          text-paper/65    7.08:1   tertiary
//
// So rule 1 is a CLOSED SET, not a threshold: a faded text alpha is `/75` or
// `/65` or it is a defect. That is deliberately stricter than "must clear
// 4.5:1", because `/66` would pass a threshold check and quietly restart the
// accumulation the scale exists to end. A new step is a design decision, and a
// design decision should cost an edit to this file.
//
// Both colours carry the SAME two steps on purpose. #76's first revision let
// `paper` keep three grandfathered alphas (/70, /60, /50) while the header and
// CLAUDE.md both claimed a two-step scale — a rule the code did not implement,
// which its own review caught. Every paper step measures comfortably on ink, so
// there was never an argument for the extra two beyond "they were already
// there", which is exactly the accumulation this gate exists to stop.
//
// The maths is then checked SEPARATELY (rule 2) rather than assumed: the
// allowed steps are recomputed from the brand colours on every run. If the
// brand ever restyles `ink` or `paper`, the closed set stops being safe and
// this says so, instead of blessing numbers that no longer clear AA.
//
// AND THE GROUND IS CHECKED (rule 3), because the scale above is only true on
// the ground each colour is meant for. #76 shipped its first revision with FOUR
// elements still failing — two page eyebrows and two rows of /fees' rate card —
// all of them `text-ink/65` sitting on **Cab Yellow**, where that step measures
// 3.84:1 rather than 4.88:1. On Cab Yellow only `/75` (4.93:1) clears AA, so
// the tertiary step does not exist there. The gate now knows that, because a
// limitation this file documented was not enough to stop the very commit that
// documented it walking into it.
//
// WHY IT IS DEPENDENCY-FREE. `checks.yml` installs nothing (#41), so this reads
// files and does arithmetic and imports nothing outside this repo. The brand
// colours are pinned as literals below AND cross-checked against the brand
// package when it happens to be installed — see `crossCheckBrand`. That gets the
// drift check without making the gate need `npm ci` to run at all.
//
// WHAT IT STILL CANNOT SEE, AND WHAT IT ASKS FOR INSTEAD. Rule 3 reads the
// template's element nesting, so it knows a class sits inside a
// `bg-cab-yellow` element. It cannot follow markup built in a `<script>` and
// injected into a slot: /fees' rate card is written by `renderCard()` into
// `<div data-fee-card>`, which is inside the yellow card, while
// /fare-estimate's result list is written into `<div data-results>`, which is
// on paper. The two are indistinguishable from the class alone, and both files
// paint yellow somewhere.
//
// Guessing either way is wrong. Assuming paper is the silent failure #76
// shipped; assuming yellow was tried and demanded that two correct captions on
// /fare-estimate be darkened for a ground they never touch — a gate that forces
// a wrong design change is worse than no gate.
//
// So it FAILS CLOSED AND ASKS. In a file whose template paints Cab Yellow, any
// faded text class inside a `<script>` must be governed by a declared ground:
//
//     // contrast-ground: paper
//
// in a comment, governing from that line to the next such pragma or the end of
// the script. An undeclared one is an error naming the file and the line. This
// is #41's pragma discipline — a narrow, reviewable, in-source declaration of
// something the machine genuinely cannot derive — and it is the only place in
// this gate where a human's word is taken for a fact.
//
// It also says nothing about SC 1.4.11 (3:1 for the boundaries of UI
// components). `border-ink/20` on the pre-registration inputs measures 1.50:1
// and is a real open question — a different success criterion, deliberately not
// smuggled in here. It is filed as #115.
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

import { existsSync, readFileSync } from "node:fs";

import {
  CLOSING_TAG,
  ELEMENT_TAG,
  RAW_ELEMENT,
  SELF_CLOSING,
  isVoid,
  templateStart,
} from "./astro-prose.mjs";
// Walking the tree is imported, never re-written: two copies of "which files
// does this gate see" is two claims about coverage, and #81 found exactly that
// drift between two extension lists. #76's review caught this file carrying a
// second `walk`.
import { walk } from "./copy-gate-files.mjs";
import { lineIndex, opensTag, tagEnd } from "./copy-gate-normalise.mjs";

// ---------------------------------------------------------------------------
// Brand colours, pinned. Mirrored from @yeapptech/yeride-brand tokens.json,
// which `crossCheckBrand` re-reads whenever the package is installed.
// ---------------------------------------------------------------------------
const BRAND = {
  ink: "#2A211A",
  paper: "#FBF8F3",
  cabYellow: "#F7B731",
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
const ALLOWED = { ink: [75, 65], paper: [75, 65] };

// The grounds each foreground is assumed to sit on by default. Rule 3 overrides
// this for `ink` wherever it can prove a Cab Yellow ground.
const GROUNDS = {
  ink: [
    ["paper", BRAND.paper],
    ["white", WHITE],
  ],
  paper: [["ink", BRAND.ink]],
};

const SRC = "src";
const ASTRO = /\.astro$/i;

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
// #76's published table, this file's header and the failure footer.
const composite = (fgHex, bgHex, alphaPercent) => {
  const fg = parseHex(fgHex);
  const bg = parseHex(bgHex);
  const a = alphaPercent / 100;
  return fg.map((v, i) => Math.round(a * v + (1 - a) * bg[i]));
};

export const contrastOf = (fgHex, bgHex, alphaPercent) =>
  contrast(composite(fgHex, bgHex, alphaPercent), parseHex(bgHex));

// ---------------------------------------------------------------------------
// Rule 3's reader: which ground does a class actually sit on?
// ---------------------------------------------------------------------------

/** The `class` (or `class:list`) attribute's value, or "" — the ONLY place a
 *  ground can be painted from.
 *
 *  Read from the class attribute rather than from the tag's whole text, which is
 *  what #76's second revision did and what its review broke: `<div
 *  data-note="bg-cab-yellow">` painted nothing and was failed anyway. A gate
 *  that fails correct code gets switched off, so a false positive here costs
 *  more than it looks. */
export function classValue(tag) {
  const m = /(?:^|[\s"'}])class(?::list)?[ \t]*=[ \t]*/i.exec(tag);
  if (!m) return "";
  let i = m.index + m[0].length;
  const open = tag[i];
  if (open === '"' || open === "'") {
    const end = tag.indexOf(open, i + 1);
    return end === -1 ? tag.slice(i + 1) : tag.slice(i + 1, end);
  }
  if (open === "{") {
    // Brace-matched rather than lazy to the first "}": a class expression may
    // hold an object or a nested ternary, and stopping early would read half of
    // it — losing exactly the branch that names the ground.
    let depth = 0;
    for (let j = i; j < tag.length; j++) {
      if (tag[j] === "{") depth++;
      else if (tag[j] === "}" && --depth === 0) return tag.slice(i + 1, j);
    }
    return tag.slice(i + 1);
  }
  // A bare value: class=foo. Not legal Astro, but read it rather than ignore it.
  return /^[^\s>]*/.exec(tag.slice(i))[0];
}

/** Frontmatter `const`/`let` names whose initialiser mentions Cab Yellow.
 *
 *  This exists because the one component that picks its ground at runtime does
 *  it this way — Header.astro's `const bg = ground === "yellow" ? "bg-cab-yellow"
 *  : …`, used as `class={bg}`. #76's second revision read only the tag text, so
 *  it saw nothing there, while its source comment claimed the case was handled.
 *  The comment was false and the review caught it.
 *
 *  Deliberately shallow: one assignment, one identifier, no dataflow. It is a
 *  lookup for a naming convention, not an evaluator, and `unresolvedYellow`
 *  below is what stops that shallowness becoming a silent miss. */
export function yellowNames(source) {
  const front = source.slice(0, templateStart(source));
  const names = new Set();
  for (const m of front.matchAll(/\b(?:const|let|var)[ \t]+([A-Za-z_$][\w$]*)[ \t]*=([^\n;]*)/g)) {
    if (PAINTS_YELLOW.test(m[2])) names.add(m[1]);
  }
  return names;
}

const PAINTS_YELLOW = /\bbg-cab-yellow\b/;

/** Grounds this gate can name from a class list. Anything else is "unknown",
 *  which shadows nothing — an element that paints no ground this knows leaves
 *  its parent's ground showing through, which is what CSS does. */
const PAINTS = [
  ["yellow", /\bbg-cab-yellow\b/],
  ["paper", /\bbg-paper\b/],
  ["ink", /\bbg-ink\b/],
  ["white", /\bbg-white\b/],
];

/** What ground this tag paints, or null. */
const groundOf = (tag, names) => {
  const cls = classValue(tag);
  if (!cls) return null;
  for (const [ground, re] of PAINTS) if (re.test(cls)) return ground;
  // `class={bg}` where a frontmatter const named `bg` mentions Cab Yellow.
  for (const name of names) {
    if (new RegExp(`\\b${name}\\b`).test(cls)) return "yellow";
  }
  return null;
};

/**
 * Every ground-painting element's subtree in an .astro template, as
 * `{ start, end, ground }` regions, plus its `<script>` bodies.
 *
 * Regions NEST, and the innermost wins — see `groundAt`. That is the second
 * thing #76's review broke: a `bg-paper` card inside a yellow section was
 * failed as though it were on yellow, which is both wrong and the shape
 * /fare-estimate's form actually has.
 */
export function scanGrounds(source) {
  const regions = [];
  const scripts = [];
  const open = []; // { depth, start, ground }
  const names = yellowNames(source);
  let depth = 0;
  let paintsYellow = names.size > 0;
  let i = templateStart(source);

  while (i < source.length) {
    if (!opensTag(source, i)) {
      i++;
      continue;
    }
    const end = tagEnd(source, i);
    // An unterminated tag closes nothing; treat the "<" as ordinary text, which
    // is what a browser does and what the copy gate's readers do.
    if (end === -1) {
      i++;
      continue;
    }
    const tag = source.slice(i, end);

    // A <script> or <style> body is not markup. Skip it wholesale, but REMEMBER
    // a script's span: rule 3 may have to ask for a declared ground inside it.
    if (RAW_ELEMENT.test(tag) && !SELF_CLOSING.test(tag)) {
      const name = tag.match(/^<[ \t]*([a-z]+)/i)[1];
      const close = source.toLowerCase().indexOf(`</${name.toLowerCase()}`, end);
      const bodyEnd = close === -1 ? source.length : close;
      if (name.toLowerCase() === "script") scripts.push([end, bodyEnd]);
      i = bodyEnd;
      continue;
    }

    // Comments, doctypes and CDATA do not nest and cannot paint a ground.
    if (!ELEMENT_TAG.test(tag)) {
      i = end;
      continue;
    }

    if (CLOSING_TAG.test(tag)) {
      depth = Math.max(0, depth - 1);
      while (open.length && open[open.length - 1].depth === depth) {
        const region = open.pop();
        regions.push({ start: region.start, end, ground: region.ground });
      }
      i = end;
      continue;
    }

    const ground = groundOf(tag, names);
    if (ground === "yellow") paintsYellow = true;

    const childless = SELF_CLOSING.test(tag) || isVoid(tag);
    if (ground && childless) regions.push({ start: i, end, ground });
    else if (ground) open.push({ depth, start: i, ground });
    if (!childless) depth++;
    i = end;
  }

  // An element left open at end of file still paints its ground over everything
  // after it — fail toward covering more, never less.
  for (const region of open) {
    regions.push({ start: region.start, end: source.length, ground: region.ground });
  }

  return { regions, scripts, paintsYellow };
}

/** The ground at `at`: the INNERMOST region containing it, or null. */
export const groundAt = (regions, at) => {
  let best = null;
  for (const r of regions) {
    if (at < r.start || at >= r.end) continue;
    if (!best || r.start > best.start) best = r;
  }
  return best ? best.ground : null;
};

const spanAt = (spans, at) => spans.find(([s, e]) => at >= s && at < e);

/** The grounds a declared `contrast-ground:` pragma may name. Keyed to BRAND so
 *  the `brand` seam reaches rule 3(b) — #76's review found the old version
 *  closing over the module constant, which made the declared-ground branch
 *  unfallible under the very seam added to make rules fallible. */
const GROUND_KEY = { paper: "paper", ink: "ink", yellow: "cabYellow", white: null };

/** The hex for a named ground, or undefined if this gate does not know it.
 *  Resolved against the `brand` ARGUMENT, never the module constant — #76's
 *  review found the declared-ground branch closing over `BRAND`, which made it
 *  unfallible under the very seam added to make rules fallible. `white` is the
 *  one ground that is not a brand token (the pre-registration inputs). */
const groundHexOf = (brand, name) => {
  if (!(name in GROUND_KEY)) return undefined;
  return GROUND_KEY[name] === null ? WHITE : brand[GROUND_KEY[name]];
};

// ---------------------------------------------------------------------------
// The pragma reader.
//
// POSITION, NOT PRESENCE was #100's lesson and #76's second revision only
// half-learned it: it required "//" immediately before the token but never that
// the "//" opened a COMMENT, so
//
//     const note = "see the note // contrast-ground: paper for details";
//
// declared a ground from inside a string literal — #100's exact defect, one
// layer in, and a control passed over it because the control's fixture used a
// URL, where "//" is not adjacent to the token. So the reader now finds the
// comment regions first and reads pragmas only from inside them.
// ---------------------------------------------------------------------------

/** The `[start, end)` spans of every real comment in a stretch of JavaScript.
 *  Strings and template literals are skipped, which is the whole point. Not a
 *  parser: it does not need to know what the code MEANS, only which bytes a
 *  reader would see as a comment. */
export function commentRegions(text) {
  const out = [];
  let offset = 0;
  let inBlock = false;

  // LINE BY LINE, with quote state reset at every newline. That is the whole
  // design, and it is a correctness fix rather than a simplification: scanning
  // quotes across the entire body means one mis-read quote swallows everything
  // after it, and JavaScript guarantees a mis-read quote. `esc` in
  // FeeSchedule.astro is
  //
  //     s.replace(/&/g, "&amp;") … .replace(/"/g, "&quot;")
  //
  // and `/"/g` is a REGEX LITERAL holding a double quote. No scanner can tell a
  // regex from a division without parsing expressions, so that quote reads as a
  // string opener, parity inverts, and every comment for the next 16KB
  // disappears — which is exactly what #76's third revision did, silently
  // losing all four live pragmas. Per-line state bounds that damage to the one
  // line that provoked it, and a pragma is written on its own line.
  //
  // Block comments still span lines, so `inBlock` is the one piece of state
  // that survives a newline — `/*` and `*/` are unambiguous, so it is safe to.
  for (const rawLine of text.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    let i = 0;
    let quote = "";

    while (i < line.length) {
      if (inBlock) {
        const close = line.indexOf("*/", i);
        out.push([offset + i, offset + (close === -1 ? line.length : close + 2)]);
        if (close === -1) {
          i = line.length;
          break;
        }
        inBlock = false;
        i = close + 2;
        continue;
      }
      const c = line[i];
      if (quote) {
        if (c === "\\") i++;
        else if (c === quote) quote = "";
        i++;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c;
        i++;
        continue;
      }
      if (c === "/" && line[i + 1] === "/") {
        out.push([offset + i, offset + line.length]);
        i = line.length;
        break;
      }
      if (c === "/" && line[i + 1] === "*") {
        inBlock = true;
        i += 2;
        continue;
      }
      i++;
    }
    offset += rawLine.length + 1;
  }
  return out;
}

const GROUND_PRAGMA = /contrast-ground:[ \t]*([a-z]+)/gi;

/** Every `contrast-ground:` declaration inside `script`, in source order, as
 *  `{ at, ground, line }` — read only from real comments. */
export function groundPragmasIn(source, script) {
  const [start, end] = script;
  const body = source.slice(start, end);
  const found = [];
  for (const [cs, ce] of commentRegions(body)) {
    for (const m of body.slice(cs, ce).matchAll(GROUND_PRAGMA)) {
      found.push({ at: start + cs + m.index, ground: m[1].toLowerCase() });
    }
  }
  return found.sort((a, b) => a.at - b.at);
}

/** The declaration governing offset `at`: the nearest one before it, or null. */
export const declaredGround = (pragmas, at) => {
  let best = null;
  for (const p of pragmas) if (p.at < at) best = p;
  return best;
};
// ---------------------------------------------------------------------------
// The scan.
// ---------------------------------------------------------------------------

// `text-<colour>/<alpha>`, with the alpha captured however it is written, so an
// arbitrary or fractional value (`text-ink/[62%]`, `text-ink/62.5`) is SEEN and
// reported rather than silently skipped by a digits-only pattern. A rule that
// cannot see a violation is worse than no rule.
const CLASS_RE = /\btext-(ink|paper)\/(\[?[0-9a-z.%]+\]?)/gi;

/** Every faded text class under `root`, with the ground it sits on — and every
 *  `contrast-ground` declaration, used or not, so a stale one can be reported.
 *  Dead pragmas are swept for the reason check-copy-gate.mjs sweeps its own
 *  (#41): a declaration left behind after its classes move reads as reviewed
 *  coverage forever. */
export const scan = (root) => {
  const usages = [];
  const pragmas = [];
  for (const file of walk(root)) {
    const raw = readFileSync(file, "utf8");
    const { regions, scripts, paintsYellow } = ASTRO.test(file)
      ? scanGrounds(raw)
      : { regions: [], scripts: [], paintsYellow: false };
    const index = lineIndex(raw);
    const declared = paintsYellow ? scripts.flatMap((s) => groundPragmasIn(raw, s)) : [];
    for (const p of declared) pragmas.push({ ...p, file, line: index.at(p.at), used: false });

    const lines = raw.split(/\r?\n/);
    let offset = 0;
    lines.forEach((line, i) => {
      for (const m of line.matchAll(CLASS_RE)) {
        const at = offset + m.index;
        // Inside a <script> of a file that paints yellow somewhere, so the
        // ground cannot be derived from nesting and must be declared.
        const script = paintsYellow ? spanAt(scripts, at) : undefined;
        const governing = script ? declaredGround(pragmas.filter((p) => p.file === file), at) : null;
        if (governing) governing.used = true;
        usages.push({
          file,
          line: i + 1,
          colour: m[1].toLowerCase(),
          alpha: m[2],
          text: m[0],
          // The innermost ground-painting ancestor in the template, or null.
          ground: groundAt(regions, at),
          needsGround: Boolean(script),
          declared: governing ? governing.ground : null,
        });
      }
      offset += line.length + 1;
    });
  }
  return { usages, pragmas };
};

/** Kept as the narrow reader the controls exercise directly. */
export const findUsages = (root) => scan(root).usages;

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
  //
  // The token NAME is not always the brand's key: `cabYellow` here is
  // `cab-yellow` there, so the map is explicit rather than derived.
  const KEYS = { ink: "ink", paper: "paper", cabYellow: "cab-yellow" };
  for (const [name, pinned] of Object.entries(BRAND)) {
    const live = parsed?.color?.[KEYS[name]]?.$value;
    if (!live) {
      errors.push(
        `${tokens} does not publish color.${KEYS[name]}.$value — the pinned ${pinned} cannot be trusted. ` +
          `If the token file changed shape, fix crossCheckBrand rather than deleting it.`,
      );
    } else if (live.toLowerCase() !== pinned.toLowerCase()) {
      errors.push(
        `brand colour drift: color.${KEYS[name]} is ${live} in the brand package, pinned as ${pinned} here. ` +
          `Update BRAND in this file, then re-check the scale — the allowed steps are only safe for the pinned values.`,
      );
    }
  }
};

// ---------------------------------------------------------------------------
// `brand` and `brandCheck` are seams, not features.
//
// `brand`: rule 2 only ever fires when the brand colours move, and a constant
// cannot be moved from a fixture, so without it the rule is unfallible-by-
// construction — deleting its body left every control green when #76
// mutation-tested this file.
//
// `brandCheck`: the drift check reads a path relative to the working directory,
// so every reader-level control silently depended on the real installed package
// agreeing. A genuine brand drift would have failed ~30 controls under labels
// about borders and eyebrows, naming nothing that was actually wrong. #76's
// review caught it. Production passes neither argument.
// ---------------------------------------------------------------------------
export const check = (root = SRC, brand = BRAND, { brandCheck = true } = {}) => {
  const errors = [];
  const notes = [];

  const { usages, pragmas } = scan(root);

  for (const u of usages) {
    const allowed = ALLOWED[u.colour];
    const alpha = Number(u.alpha);

    // RULE 1 — every usage is on the scale.
    if (!Number.isFinite(alpha) || !allowed.includes(alpha)) {
      errors.push(
        `${u.file}:${u.line} — \`${u.text}\` is not on the scale. ` +
          `Allowed for ${u.colour}: ${allowed.map((a) => `text-${u.colour}/${a}`).join(", ")}.`,
      );
      continue;
    }

    // RULE 3 — and clears AA on the ground it actually sits on.
    //
    // (a) Proved by the template's own nesting. The INNERMOST painting ancestor
    // wins, so a bg-paper card inside a yellow section is on paper.
    if (u.ground) {
      const groundHex = groundHexOf(brand, u.ground);
      const ratio = contrastOf(brand[u.colour], groundHex, alpha);
      if (ratio < AA_NORMAL) {
        errors.push(
          `${u.file}:${u.line} — \`${u.text}\` sits on a ${u.ground} ground, where it measures ` +
            `${ratio.toFixed(2)}:1, below WCAG AA's ${AA_NORMAL}:1.` +
            (u.ground === "yellow"
              ? ` On Cab Yellow the tertiary step does not exist — use text-ink/75 (4.93:1) or full text-ink (8.85:1).`
              : ""),
        );
      }
      continue;
    }

    // (b) Declared, because it is generated in a script and injected into a
    // slot this gate cannot follow. Missing is an error, never a default.
    if (u.needsGround) {
      if (!u.declared) {
        errors.push(
          `${u.file}:${u.line} — \`${u.text}\` is generated in a <script> in a file that paints a Cab ` +
            `Yellow ground, so its ground cannot be derived. Declare it above this line with a comment: ` +
            `\`// contrast-ground: ${Object.keys(GROUND_KEY).join("|")}\`.`,
        );
        continue;
      }
      const groundHex = groundHexOf(brand, u.declared);
      if (!groundHex) {
        errors.push(
          `${u.file}:${u.line} — \`contrast-ground: ${u.declared}\` names no ground this gate knows. ` +
            `Use one of: ${Object.keys(GROUND_KEY).join(", ")}.`,
        );
        continue;
      }
      const ratio = contrastOf(brand[u.colour], groundHex, alpha);
      if (ratio < AA_NORMAL) {
        errors.push(
          `${u.file}:${u.line} — \`${u.text}\` is declared to sit on ${u.declared}, where it measures ` +
            `${ratio.toFixed(2)}:1, below WCAG AA's ${AA_NORMAL}:1.`,
        );
      }
    }
  }

  // A declaration that governs nothing is swept, exactly as check-copy-gate.mjs
  // sweeps a `copy-gate-allow` that matches nothing: a pragma left behind after
  // its classes move reads as reviewed coverage forever.
  for (const p of pragmas) {
    if (!p.used) {
      errors.push(`${p.file}:${p.line} — \`contrast-ground: ${p.ground}\` governs nothing any more — delete it`);
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

  if (brandCheck) crossCheckBrand(errors, notes);
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
    console.error("  The scale (wayfinder #76):");
    console.error("    text-ink / text-paper      14.89:1  primary — the claim itself");
    console.error("    text-ink/75  on paper       6.71:1  secondary — prose, links, disclosures");
    console.error("    text-ink/65  on paper       4.88:1  tertiary — captions, eyebrow labels, meta");
    console.error("    text-paper/75 on ink        8.93:1  secondary, on the dark pages");
    console.error("    text-paper/65 on ink        7.08:1  tertiary, on the dark pages");
    console.error("  On CAB YELLOW there is no tertiary step: /65 is 3.84:1, /75 is 4.93:1.");
    console.error("  A new step is a design decision. Change ALLOWED in scripts/check-contrast.mjs on purpose.");
    process.exit(1);
  }

  console.log("✓ contrast — every text-ink/text-paper alpha is on the scale and clears WCAG AA on its ground");
}
