// Controls for which files get the tag views. Plain node, no runner, no deps:
//
//     node scripts/copy-gate-files.test.mjs
//
// Wayfinder #81 added this file, and the rule it covers is a two-sided one, so
// both lists below are load-bearing. Widening the tag views closes a hole in the
// shipped bytes; widening them too far reads a TypeScript generic as markup and
// fails the build on a phrase nobody wrote.
//
// BOTH GATES ARE SPAWNED over temporary fixture trees, never the real one. The
// claim is not that copy-gate-files.mjs holds the right extensions — it is that
// the GATE fails, and between a table and a failure sit the walk, the view
// selection and the allowlist. #83's review made exactly that point about the
// suspension rule: delete the rule's errors.push and every reader-level control
// still passed.
//
// Like scripts/copy-gate-patterns.test.mjs, this lives in scripts/, which
// neither gate scans, so the forbidden phrases below are safe to write down.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_GATE = fileURLToPath(new URL("./check-copy-gate.mjs", import.meta.url));
const DIST_GATE = fileURLToPath(new URL("./check-dist-copy-gate.mjs", import.meta.url));

let failures = 0;
let checks = 0;
// The total is COUNTED, not written down. Several of the controls below are
// loops, so a hand-kept total is one edit away from claiming coverage that was
// removed — which is the failure mode this whole file exists to catch.
const say = (ok, label, detail) => {
  checks++;
  if (ok) return;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
  failures++;
};

/** Run a gate over a throwaway tree of {relativePath: contents}. */
function runGate(gate, files) {
  const dir = mkdtempSync(join(tmpdir(), "copy-gate-files-"));
  try {
    for (const [rel, body] of Object.entries(files)) {
      const path = join(dir, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
    }
    const r = spawnSync(process.execPath, [gate], { cwd: dir, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// The source gate walks src/ and public/ and throws if either is missing, so
// every fixture gets both. A .nojekyll carries no copy and is not scanned.
const src = (files) =>
  runGate(SOURCE_GATE, { "src/.keep": "", "public/.nojekyll": "", ...files });

// The dist gate is asserted on WHAT IT REPORTS, not on its exit code, and that is
// deliberate. Its ALLOWED list is keyed to real built paths, so any synthetic
// tree fails it with "allowed but no longer appears" — an exit code that would
// be 1 whatever the fixture said, and therefore proves nothing. Rebuilding the
// allowlist inside the fixture would duplicate it, which is the drift the one
// shared table exists to prevent. Naming the fixture path AND the phrase is the
// precise claim anyway: this file, read this way, yielded this match.
const dist = (files) => runGate(DIST_GATE, files);
const reported = (out, file, phrase) =>
  out.includes(file.replace(/^dist\//, "")) && out.includes(phrase);

// ---------------------------------------------------------------------------
// The fixtures are ONE claim written two ways. The contiguous form must fail
// everywhere — if it does not, the fixture is wrong and the split form proves
// nothing. The split form is what #81 is about: a claim broken by a tag.
const WHOLE = "Flat fees, no surprises.";
const SPLIT = "Flat fees, <strong>no</strong> surprises.";
const MSG = "no surprises";

// ------------------------------------------------- 1. baselines: empty is green
{
  const { code, out } = src({ "src/pages/index.astro": "<p>Rates are metered.</p>" });
  say(code === 0, "fixture baseline — an innocent source tree must pass", out.trim());
}
{
  const { out } = dist({ "dist/index.html": "<p>Rates are metered.</p>" });
  say(!out.includes(MSG), "fixture baseline — an innocent dist tree must report no claim", out.trim());
}

// ------------------------------------------- 2. must fire: served bytes, split
// Everything under public/ is copied into dist/ byte for byte, so a tag in a
// .json there is markup a browser will read. This is #81's second case, and it
// passed both gates before #81.
for (const [name, file] of [
  ["public/*.json", "public/content.json"],
  ["public/*.txt", "public/notice.txt"],
  ["public/*.webmanifest", "public/site.webmanifest"],
]) {
  const { code, out } = src({ [file]: `{"lead": ${JSON.stringify(SPLIT)}}` });
  say(code === 1 && out.includes(MSG), `the SOURCE gate must fail — tag-split claim in ${name}`, out.trim());
}

// #81's first case, and the one that matters: /fees renders its charge rows
// client-side, so its copy exists only in a bundle. A .js file got character
// reference decoding but no tag views, in the gate whose whole job is the
// shipped bytes.
{
  const file = "dist/_astro/Chunk.abcd1234.js";
  const { out } = dist({ [file]: `el.innerHTML=${JSON.stringify(SPLIT)};` });
  say(
    reported(out, "_astro/Chunk.js", MSG),
    "the DIST gate must report — tag-split claim in a .js bundle",
    out.trim(),
  );
}
for (const [name, file] of [
  [".json", "dist/content.json"],
  [".txt", "dist/notice.txt"],
  [".css", "dist/site.css"],
]) {
  const { out } = dist({ [file]: `/* ${SPLIT} */` });
  say(reported(out, file, MSG), `the DIST gate must report — tag-split claim in ${name}`, out.trim());
}

// ------------------------------------------------- 3. must fire: contiguous
// The plain view catches these already and always did. They are here because a
// change that broke them would otherwise look like a change that merely narrowed
// the tag views.
{
  const { code, out } = src({ "src/i18n/copy.ts": `export const lead = ${JSON.stringify(WHOLE)};` });
  say(code === 1 && out.includes(MSG), "the SOURCE gate must fail — contiguous claim in a .ts", out.trim());
}
{
  const { out } = dist({ "dist/_astro/Chunk.abcd1234.js": `el.textContent=${JSON.stringify(WHOLE)};` });
  say(
    reported(out, "_astro/Chunk.js", MSG),
    "the DIST gate must report — contiguous claim in a .js",
    out.trim(),
  );
}

// --------------------------------------- 4. must NOT fire: TypeScript generics
// The other half of #81, and the reason the source gate does not simply run the
// tag views everywhere. In a .ts file "<" is an operator, not a tag: the scan
// runs to the next ">" and DELETING what it swallows brings words together that
// the author wrote far apart. Measured over the real src/ tree there are 19 such
// spans and none of them weld a §5 phrase — but "none today" is not a rule, and
// this is the control that keeps the exclusion honest.
//
// Each fixture below is ordinary TypeScript, in the shape src/i18n/feeLabels.ts
// actually uses, that fires ONLY if the generic is read as a tag and removed.
// Both were checked against the normaliser directly before being written down:
// with markup on, the first yields "rates: map>> = flat" and the second
// "prices: record>> = fixed" — §5 hits on phrases nobody wrote. A control that
// cannot fail is decorative, and an earlier draft of this list held one: the
// triple-slash `/// <reference … />` in env.d.ts, which is inert here whatever
// the tag views do, because the gate blanks line-leading comments before pass 2
// ever sees them.
for (const [name, body] of [
  [
    "a generic between the noun and the adjective",
    `const rates: Map<string, Record<Lang, ReadonlyArray<ServiceLabelDefinition>>> = flat;`,
  ],
  [
    "a nested Record between the noun and the adjective",
    `export const prices: Record<string, Record<Lang, ReadonlyArray<ServiceLabel>>> = fixed;`,
  ],
]) {
  const { code, out } = src({ "src/lib/types.ts": body });
  say(code === 0, `the SOURCE gate must NOT fail — ${name}`, out.trim());
}

// The same text in a .astro file IS markup by syntax and stays covered — which
// is what makes the line above an exclusion of .ts rather than a hole.
{
  const { code, out } = src({ "src/pages/index.astro": `<p>${SPLIT}</p>` });
  say(code === 1 && out.includes(MSG), "the SOURCE gate must fail — tag-split claim in .astro", out.trim());
}

// ------------------------------------------ 5. the two tables cannot diverge
// Both gates import the same SCAN_EXT and BINARY, so a type one reads and the
// other does not is now impossible by construction rather than by review. This
// asserts the import wiring, which is the only way that property can break.
{
  const files = await import("./copy-gate-files.mjs");
  const source = await import("node:fs").then((fs) =>
    fs.readFileSync(SOURCE_GATE, "utf8") + fs.readFileSync(DIST_GATE, "utf8"),
  );
  say(
    files.SCAN_EXT instanceof RegExp && files.BINARY instanceof RegExp,
    "copy-gate-files.mjs must export SCAN_EXT and BINARY",
  );
  say(
    !/const\s+SCAN_EXT\s*=/.test(source) && !/const\s+BINARY\s*=/.test(source),
    "neither gate may declare its own SCAN_EXT or BINARY — they must import the shared table",
  );
  say(
    /copy-gate-files\.mjs/.test(source),
    "both gates must import scripts/copy-gate-files.mjs",
  );
}

console.log(
  `${failures ? "✗" : "✓"} copy-gate file types: ${checks} controls, ${failures} failure${failures === 1 ? "" : "s"}`,
);
process.exit(failures ? 1 : 0);
