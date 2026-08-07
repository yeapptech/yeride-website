// `.env.example` and scripts/env-required.mjs must name the same six variables.
// Wayfinder #70.
//
// WHY THIS EXISTS. #70 committed `.env.example` so the variable list stops
// living in seven prose documents. That only helps if the committed file stays
// true: a `.env.example` that has quietly fallen a variable behind is worse
// than no `.env.example`, because a contributor copies it, gets a `.env` that
// looks complete, and fails at `npm run build` with a variable they were never
// told about. This fails on the pull request that introduces the divergence
// instead.
//
// WHY IT IS NOT IN check-env.mjs. That script imports Vite and needs the six
// secrets present, so it can only run on a deploy — it is not in `checks.yml`
// for exactly that reason, and drift caught there is drift caught after the
// merge. Comparing NAMES needs neither Vite nor secrets, so this runs in
// `npm run checks` alongside route parity and the copy gate, dependency-free by
// #41's design.
//
// WHY THIS IS NOT A THIRD ENV READER. #72 is open about the repo having two
// readers of the same environment that can disagree: check-env.mjs through
// Vite's `loadEnv`, and check-fee-labels.mjs's hand-rolled `fromDotEnv()`. This
// is not a third one, and the difference is structural rather than a promise:
// it reads NAMES ONLY and never looks at a value. It cannot answer "what will
// the build see" — no precedence between .env, .env.local and the mode files,
// no process.env overlay, no quote stripping, no interpolation — because it is
// asking a different question about a different file. `.env.example` is
// committed, hand-written and loaded by nothing; Vite never reads it. If this
// ever needs a value, it has become the thing #72 is about, and the answer is
// to resolve #72 rather than to widen this.
//
// WHY STRICT IN BOTH DIRECTIONS. A name in one file and not the other fails,
// whichever side it is on. There is no optional PUBLIC_* variable today, and a
// superset rule would let a new variable reach `.env.example` and
// deploy-all.yml while missing `REQUIRED` — the precise drift #70 was filed
// over. When a genuinely optional variable arrives this will fail loudly and
// force the decision to be made on purpose, which is the right cost.

import { existsSync, readFileSync } from "node:fs";

import { REQUIRED } from "./env-required.mjs";

const FILE = ".env.example";

// Fail closed. "Could not check" must never read as "checked, fine" — the same
// rule check-env.mjs applies to a missing Vite.
if (!existsSync(FILE)) {
  console.error(`✗ env example — ${FILE} is missing, so nothing was checked`);
  console.error(`  It is committed on purpose: .gitignore has \`.env*\` with \`!.env.example\`.`);
  console.error(`  Restore it, or if it was deliberately deleted, delete this check with it.`);
  process.exit(1);
}

// NAMES ONLY — everything to the right of the first `=` is ignored on purpose;
// see the header. `export ` is tolerated because a shell-sourceable env file is
// a normal thing to write, and a name this failed to see would read as a
// missing variable and fail for the wrong reason.
const seen = new Set();
const duplicates = new Set();

for (const raw of readFileSync(FILE, "utf8").split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq === -1) continue;
  const name = line.slice(0, eq).replace(/^export\s+/, "").trim();
  // A line that opens with `=` has no name to report; skipping it keeps the
  // failure text from naming the empty string.
  if (!name) continue;
  if (seen.has(name)) duplicates.add(name);
  seen.add(name);
}

const expected = new Set(REQUIRED.map((v) => v.name));

// Sets on both sides, so a name that is BOTH duplicated and unexpected is
// reported once as unexpected and once as duplicated — two facts — rather than
// once per occurrence, which made the same sentence appear twice.
const missing = [...expected].filter((n) => !seen.has(n));
const extra = [...seen].filter((n) => !expected.has(n));

const errors = [];
for (const n of missing) {
  errors.push(`${n} is in scripts/env-required.mjs but not in ${FILE}`);
}
for (const n of extra) {
  errors.push(`${n} is in ${FILE} but not in scripts/env-required.mjs`);
}
// dotenv keeps the last assignment, so a duplicated name is one variable
// wearing two values — and the one a reader edits may not be the one that wins.
for (const n of duplicates) {
  errors.push(`${n} is assigned more than once in ${FILE}`);
}

if (errors.length) {
  console.error(`✗ env example (${errors.length} disagreement${errors.length > 1 ? "s" : ""})`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  These two must name the same variables. Adding one is a four-place`);
  console.error(`  change: scripts/env-required.mjs, ${FILE}, the "Create env file" step`);
  console.error(`  in .github/workflows/deploy-all.yml, and the GitHub Secret itself.`);
  process.exit(1);
}

console.log(`✓ env example (${expected.size} names match scripts/env-required.mjs)`);
