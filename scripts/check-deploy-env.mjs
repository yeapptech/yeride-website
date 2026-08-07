// The deploy workflow's "Create env file" step must write exactly the required
// variables, each from its own secret, and must truncate once and append after.
// Wayfinder #90.
//
// WHY THIS EXISTS. A required PUBLIC_* name has to appear in THREE places for
// the site to work: `scripts/env-required.mjs`, `.env.example`, and the "Create
// env file" step in .github/workflows/deploy-all.yml, which is the only thing
// that puts a value into the deploy's .env. #70 made the first two assert each
// other. The third was unasserted, and it is the one whose omission produces
// the exact failure the whole env chain exists to catch.
//
// Add a variable to the first two, create the GitHub Secret, forget the
// workflow line: `npm run checks` passes, because those two agree. `npm run
// build` passes locally, because your own .env has the value. Then the deploy
// runs, the step never writes the line, and check-env.mjs fails on `main` —
// AFTER the merge — reporting a missing secret when the secret exists and the
// workflow line does not. The gate is right that the value is absent and wrong
// about why, which is the failure shape this map has re-opened tickets over.
// This fails on the pull request instead, naming the actual missing line.
//
// The reverse drifts silently and is checked too: a variable dropped from
// REQUIRED and `.env.example` but left in the step just writes a line nobody
// reads. Harmless on its own, and it is how the step accumulates names that
// mean nothing.
//
// WHY IT IS NOT PART OF check-env-example.mjs. That script's header makes a
// STRUCTURAL claim — it reads a committed dotenv file that Vite never loads, so
// it can never become a third answer to "what will the build see" (#72). A YAML
// workflow reader inside it would falsify that sentence, and the caveats this
// file needs about what a `run:` block can and cannot be read out of would bury
// the one point that file exists to make. What must not be duplicated is the
// list of names, and that already lives in exactly one place, imported by both.
// Two gates over one hub do not drift; two copies of six names do.
//
// The set-difference loop and the closing "four-place change" paragraph are
// near-duplicates of that file's, and a review flagged it. Left duplicated on
// purpose: what makes drift dangerous in #57's and #68's cases is that it
// creates FALSE COVERAGE — a pattern in one gate and not the other reads as
// checked when it is not. Two error epilogues drifting misleads a reader for as
// long as it takes to read the other file; it cannot make either gate check
// less. Sharing them would couple two scripts whose whole point is that they
// have different constraints, to save a dozen lines.
//
// WHY IT IS DEPENDENCY-FREE, AND WHAT THAT COSTS. `npm run checks` installs
// nothing by design (#41), and that is precisely the rule that keeps this gate
// useful — the drift it catches is introduced on a pull request, which has no
// registry and no secrets. So this does NOT parse YAML. It anchors on the step
// by name, takes the block that follows, and reads the `echo` lines inside it.
// What that buys, and it is not a consolation prize: inside a `run:` block a
// leading `#` is a SHELL comment, so a commented-out echo genuinely does not
// write the line, and skipping those lines is correct behaviour rather than a
// blind spot. Anchoring on the step is also what keeps a sample of this YAML
// living elsewhere in the repo (#71) from being read as the real thing — only
// this file, and only this step inside it, is ever looked at.
//
// The cost is that it recognises ONE way of writing the line. A line the regex
// below does not match is reported as unrecognised, on its own line number,
// rather than counted as a missing variable — because naming the wrong cause is
// the fault this whole ticket is about. If the step is ever legitimately
// rewritten (printf, a heredoc, a matrix), this fails loudly and the shape it
// accepts has to be widened on purpose.
//
// WHY IT CHECKS THE REDIRECTION TOO. `>` truncates and `>>` appends, so the
// first line must be `>` and every later one `>>`. A second `>` writes a .env
// holding one variable, and the deploy then fails naming five missing secrets
// that all exist — the same misleading failure, from the same file, for a
// different reason. The operator is already in hand from the same parse, so a
// gate that read it and looked away would be choosing not to know.
//
// THAT RULE IS OVER EVERY LINE THAT REDIRECTS INTO .env, not only the ones
// naming a PUBLIC_ variable, and the first version of this gate got it wrong.
// It skipped any line without `PUBLIC_` in it, so a trailing
// `echo "NODE_ENV=production" > .env` passed green while truncating the file to
// that one line — the deploy then failing on all SIX secrets, every one of
// which exists. The discipline belongs to the file, not to the variables: a
// line that writes .env matters whatever it writes. Name parity still comes
// from the PUBLIC_ lines alone; the two questions are read off the same pass
// but are not the same set.
//
// The residue, said plainly rather than implied away: this sees `>` and `>>`
// redirects into `.env`. It does not see a heredoc, a `tee`, a `cp` over the
// file, or an `rm` of it, and it cannot — recognising shell in general is not
// something a 200-line gate does. Those would all fail the deploy loudly at
// check-env.mjs rather than ship a bad site, which is the direction to be wrong
// in; the case worth catching here was the one that looks correct in review.
//
// WHY IT CHECKS THE SECRET NAME. `echo "PUBLIC_FIREBASE_API_KEY=${{
// secrets.PUBLIC_FIREBASE_AUTH_DOMAIN }}"` puts the name in the step and the
// wrong value in the .env. Every gate downstream passes — it is non-empty and
// printable ASCII — and the site fails in the browser. Asserting the two match
// is what makes "the name appears" mean what this gate claims it means. They
// all match today; if a secret is ever deliberately named differently, this
// fails loudly and forces the decision, which is #70's discipline.
//
// WHAT IT CANNOT SEE: the GitHub Secret itself, the fourth place. No gate in
// this repo can, without a token and a network call, and neither belongs in
// `npm run checks`. check-env.mjs still catches that case on the deploy, by way
// of the empty string a missing secret interpolates to — and with this gate
// green, "missing or empty" on a deploy now means the SECRET, because the
// workflow line has been proven present on every pull request since.

import { existsSync, readFileSync } from "node:fs";

import { REQUIRED } from "./env-required.mjs";

const FILE = ".github/workflows/deploy-all.yml";
const STEP = "Create env file";

// The one shape this gate recognises. Anchored end to end on purpose: a
// trailing pipe, a second redirect or a stray argument all mean something this
// cannot reason about, and should be reported as unrecognised rather than read
// past.
const ECHO = /^echo\s+"(PUBLIC_[A-Z0-9_]+)=\$\{\{\s*secrets\.([A-Za-z0-9_]+)\s*\}\}"\s*(>>?)\s*(\S+)$/;

// Any line that redirects into .env, whatever it writes. `2> .env` and the like
// do not match, because the operator must be preceded by whitespace or start of
// line — a stderr redirect is not writing variables.
const REDIRECT = /(?:^|\s)(>>?)\s*\.env$/;

const fail = (...lines) => {
  for (const l of lines) console.error(l);
  process.exit(1);
};

// Fail closed, three times over. "Could not check" must never read as
// "checked, fine" — the rule check-env.mjs applies to a missing Vite and
// check-env-example.mjs to a missing file.
if (!existsSync(FILE)) {
  fail(
    `✗ deploy env — ${FILE} is missing, so nothing was checked`,
    `  That file is the deploy. If it was renamed, rename it here too.`,
  );
}

const lines = readFileSync(FILE, "utf8").split("\n").map((l) => l.replace(/\r$/, ""));

const stepAt = lines.findIndex((l) => new RegExp(`^\\s*-\\s+name:\\s*${STEP}\\s*$`).test(l));
if (stepAt === -1) {
  fail(
    `✗ deploy env — no "${STEP}" step in ${FILE}, so nothing was checked`,
    `  This gate anchors on that step by name. If the step was renamed, change`,
    `  STEP in scripts/check-deploy-env.mjs to match.`,
  );
}

// The step's block: everything indented deeper than the `-` that opens it,
// blank lines included, up to the next line at or above that indent.
const stepIndent = lines[stepAt].match(/^\s*/)[0].length;
const block = [];
for (let i = stepAt + 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() && line.match(/^\s*/)[0].length <= stepIndent) break;
  block.push({ text: line.trim(), lineNo: i + 1 });
}

const written = [];
const unrecognised = [];
// Every line that redirects into .env, in file order — the sequence the
// truncate-then-append rule is judged over. A superset of `written`: it also
// holds lines that write .env without naming a PUBLIC_ variable, which are
// exactly the ones the first version of this gate walked past.
const writers = [];

for (const { text, lineNo } of block) {
  // A `#` inside a `run:` block is a shell comment: the line does not run, so
  // it does not write the variable, so it is right to skip. Outside the block's
  // scalar it is a YAML comment, which also does not run.
  if (!text || text.startsWith("#")) continue;

  const redirect = text.match(REDIRECT);
  if (redirect) writers.push({ op: redirect[1], lineNo });

  // Name parity is a question about the PUBLIC_ lines only; the redirection
  // question above is about all of them.
  if (!text.includes("PUBLIC_")) continue;
  const m = text.match(ECHO);
  // The operator is captured but not kept here — `writers` above owns that
  // question, over a wider set of lines than this one.
  if (m) written.push({ name: m[1], secret: m[2], target: m[4], lineNo });
  // Deduped: a line that names the variable and its secret mentions it twice,
  // which is one fact, not two.
  else unrecognised.push({ names: [...new Set(text.match(/PUBLIC_[A-Z0-9_]+/g) ?? [])], lineNo });
}

if (!written.length && !unrecognised.length) {
  fail(
    `✗ deploy env — the "${STEP}" step writes no PUBLIC_ variable at all`,
    `  Every one of the ${REQUIRED.length} required variables reaches the deploy through`,
    `  that step. An empty one ships a site with no working backend.`,
  );
}

const errors = [];

// Names seen in a line this gate could not read are NOT reported as missing —
// they are present, just written in a way that cannot be verified. Reporting
// them as absent would name the wrong cause, which is the whole subject of #90.
const unreadable = new Set(unrecognised.flatMap((u) => u.names));
for (const { names, lineNo } of unrecognised) {
  errors.push(
    names.length
      ? `${names.join(", ")} — line ${lineNo} of the step is not a shape this gate can read`
      : `line ${lineNo} of the step mentions PUBLIC_ in a shape this gate cannot read`,
  );
}

const expected = REQUIRED.map((v) => v.name);
const seen = new Set();
const duplicates = new Set();
for (const { name } of written) {
  if (seen.has(name)) duplicates.add(name);
  seen.add(name);
}

for (const name of expected) {
  if (!seen.has(name) && !unreadable.has(name)) {
    errors.push(`${name} is in scripts/env-required.mjs but the step never writes it`);
  }
}
for (const name of seen) {
  if (!expected.includes(name)) {
    errors.push(`${name} is written by the step but is not in scripts/env-required.mjs`);
  }
}
// Two echoes of one name is one variable wearing two values, and the one a
// reader edits may not be the one dotenv keeps.
for (const name of duplicates) {
  errors.push(`${name} is written more than once by the step`);
}

for (const { name, secret, target, lineNo } of written) {
  if (secret !== name) {
    errors.push(
      `${name} is written from \${{ secrets.${secret} }} on line ${lineNo}\n` +
        `      the name reaches .env with the wrong secret's value — non-empty, printable,\n` +
        `      past every later gate, and wrong in the browser`,
    );
  }
  if (target !== ".env") {
    errors.push(
      `${name} is written to ${target}, not .env, on line ${lineNo}\n` +
        `      only .env is loaded by the build; anything else is written and never read`,
    );
  }
}

// `>` truncates, `>>` appends: the first line starts the file and every later
// one adds to it. Judged over EVERY line that writes .env, not just the ones
// naming a variable — a `>` on any of them discards what is above it — and on
// the first such line by position, not on PUBLIC_API_URL by name, because
// whichever line comes first is the one that has to start the file.
if (writers.length) {
  const [first, ...rest] = writers;
  if (first.op !== ">") {
    errors.push(
      `line ${first.lineNo} is the step's first write to .env and uses \`${first.op}\`, not \`>\`\n` +
        `      the first line must truncate, or .env keeps whatever was there before it`,
    );
  }
  for (const w of rest) {
    if (w.op !== ">>") {
      errors.push(
        `line ${w.lineNo} writes .env with \`${w.op}\`, not \`>>\`\n` +
          `      it truncates .env, so everything written above it is discarded and the\n` +
          `      deploy fails naming secrets that all exist`,
      );
    }
  }
}

if (errors.length) {
  console.error(`✗ deploy env (${errors.length} problem${errors.length > 1 ? "s" : ""})`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  The "${STEP}" step in ${FILE} is the only thing that`);
  console.error(`  puts a value into the deploy's .env. Adding a variable is a four-place`);
  console.error(`  change: scripts/env-required.mjs, .env.example, that step, and the`);
  console.error(`  GitHub Secret itself — which is the one place nothing here can check.`);
  process.exit(1);
}

console.log(`✓ deploy env (${written.length} variables written by "${STEP}", truncate then append)`);
