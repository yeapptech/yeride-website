// Required PUBLIC_* variables — a missing one fails the build instead of
// shipping a page that cannot work.
// Wayfinder #59.
//
// WHY THIS EXISTS. Astro inlines `import.meta.env.PUBLIC_*` at BUILD time, and
// a value that is not there is inlined as a falsy literal — `undefined` where
// the key is absent, `""` where the key is present but empty. Rollup then folds
// the branch that tested it and drops everything the branch guarded. Measured
// against vite 6.4.1 with Astro's `envPrefix: "PUBLIC_"`, on the shape of the
// pre-registration handler, with the esbuild minifier OFF so the elimination is
// demonstrably Rollup's own: with PUBLIC_API_URL set the built bundle contains
// `v1/auth/register`; with it empty the fetch is gone from the output entirely
// and only the "is not set" branch survives. The page still builds, still
// renders, still shows a submit button, and can never submit. Nothing goes red.
//
// The production trigger is precisely the EMPTY case, the `""` one:
// deploy-all.yml's "Create env file" step writes
// `PUBLIC_API_URL=${{ secrets.PUBLIC_API_URL }}`, and a secret that does not
// exist interpolates to the empty string. So a renamed or deleted secret
// produces a defined key with no value — which is why this checks for a
// non-empty value rather than for a defined key. A check that only asked
// "is the key defined?" would pass the exact failure it was written for.
//
// WHY ALL SIX AND NOT JUST PUBLIC_API_URL. All six are inlined the same way, so
// all six go missing the same way. They do not FAIL the same way, though, and
// that asymmetry is the point: the other five land in an error state the pages
// already draw — /fees renders its designed error, /fare-estimate shows its
// service-error line — so a person looking at the site can see something is
// wrong. PUBLIC_API_URL is the one that fails into a page that looks fine.
//
// WHERE IT RUNS: inside `npm run build`, ahead of `astro build`, so it covers
// the deploy and local builds alike and needs no CI wiring of its own. NOT in
// `npm run checks`, which runs on every pull request with no secrets present
// and would fail on all of them — #41 keeps that job dependency-free by design.
//
// WHY IT IMPORTS VITE. The question is not "is there a line in .env", it is
// "will the BUILD see a value", and only Vite can answer that. It reads .env,
// .env.local, .env.production and .env.production.local in that order and then
// lets process.env override — and an empty value in a later source blanks a
// non-empty one from an earlier source. Re-implementing that here would be a
// second answer to a question that already has one, free to drift from it.
//
// It is deliberately NOT declared in package.json. The contract is "the same
// Vite the build uses", and that is what the bare specifier resolves to —
// Astro's own copy, hoisted. Declaring a version range here would allow a
// SECOND copy to be installed alongside it, and a second copy is the one thing
// that could make this check and the build disagree, which is the entire
// failure it exists to prevent. If it cannot be resolved at all, the import
// below fails closed and says so.
//
// WHAT IT CANNOT DO: it checks that a value EXISTS, never that it works. A
// wrong key, a revoked key, or a URL pointing at the wrong environment all pass
// here and fail in the browser.
//
// MAINTENANCE: the three arguments to loadEnv below are hardcoded to match what
// Astro passes. They agree today because astro.config.mjs sets none of `root`,
// `vite.envDir` or `vite.envPrefix`, and `npm run build` passes no --mode. If
// any of those four ever changes, change this call with it — otherwise the
// check starts reading a different environment than the build does, silently.

let loadEnv;
try {
  ({ loadEnv } = await import("vite"));
  // Resolving is not the same as getting a usable export: a Vite that no longer
  // ships loadEnv would sail through the destructure and die later as a bare
  // "loadEnv is not a function", losing the explanation below.
  if (typeof loadEnv !== "function") throw new Error("vite exports no loadEnv()");
} catch (err) {
  // Fail closed, and name the cause: without Vite this cannot answer the
  // question at all, and "could not check" must never read as "checked, fine".
  // `err` is whatever was thrown — not necessarily an Error — so it is coerced
  // rather than dereferenced, or the catch itself would throw.
  console.error(`✗ env — could not load Vite, so nothing was checked`);
  console.error(`  This reads the environment through Astro's own Vite (see the header).`);
  console.error(`  Run \`npm ci\` first; if that is done, the install layout is not one`);
  console.error(`  that hoists Vite to the project root, which this script requires.`);
  console.error(`  ${err?.message ?? err}`);
  process.exit(1);
}

// `npm run build` passes no --mode, so `astro build` builds with Vite's
// "production" mode and the project root as envDir; astro.config.mjs overrides
// neither, nor the "PUBLIC_" prefix.
const env = loadEnv("production", process.cwd(), "PUBLIC_");

// All three Firebase values feed one `initializeApp` call, so any one of them
// missing has the same single consequence.
const NO_CALLABLE = "the estimateFares callable cannot be reached, so no fare is ever quoted";

// Every one of the six is a URL, a hostname, a project id or an API key, so
// every legitimate value is printable ASCII with no spaces in it.
//
// This is a POSITIVE rule, and that is the whole point. The version before it
// listed the invisible characters to reject, and a list like that cannot be
// finished: it stopped at U+200D, so U+200E and U+200F — the next two code
// points, and the artifacts a Windows or web paste most often carries — went
// straight through, along with U+00AD, the variation selectors and some four
// thousand others. Each of them survives dotenv (`.trim()` removes U+00A0 and
// a plain space, but nothing in category Cf), reaches the bundle intact, and
// makes `fetch` throw before it touches the network: green build, dead form.
// #57's review made the same finding about a homoglyph check "scoped to the
// example, not the class". A whitelist has no tail left to miss.
//
// The cost is a false failure on a legitimately non-ASCII value. None of the
// six can have one, and the failure would be loud and one line to fix, which is
// the right direction for a gate to be wrong in.
const PRINTABLE = /^[\x21-\x7e]+$/;

const REQUIRED = [
  {
    name: "PUBLIC_API_URL",
    breaks:
      "pre-registration cannot submit — the fetch is eliminated from the bundle, so\n" +
      "      /drivers and /riders ship a form whose button can never reach the API",
    // A separate cause with a separate consequence, so it gets its own string
    // rather than borrowing `breaks`: with a non-empty value the fetch is in
    // the bundle, it just builds the wrong URL. One string covering both would
    // have to describe an elimination that did not happen.
    // Returns nothing when the value is fine, a {problem, breaks} pair when not.
    shape: (v) =>
      v.endsWith("/") ? undefined : {
        problem: "must end with a trailing slash, because the form appends `v1/auth/register` to it",
        breaks:
          "the fetch ships, but `v1/auth/register` is concatenated straight onto this\n" +
          "      value, so it builds a URL that never reaches the register endpoint",
      },
  },
  {
    name: "PUBLIC_GOOGLE_MAPS_API_KEY",
    breaks:
      "/fare-estimate cannot load Google Maps, so init() rejects and the page shows\n" +
      "      its service-error line on arrival — no address can be entered at all",
  },
  { name: "PUBLIC_FIREBASE_API_KEY", breaks: NO_CALLABLE },
  { name: "PUBLIC_FIREBASE_AUTH_DOMAIN", breaks: NO_CALLABLE },
  { name: "PUBLIC_FIREBASE_PROJECT_ID", breaks: NO_CALLABLE },
  {
    name: "PUBLIC_FEE_SCHEDULE_URL",
    breaks:
      "getFeeSchedule throws before it fetches, so /fees and /es/fees render their\n" +
      "      designed error state on every visit and publish no rate card",
  },
];

const errors = [];
// The footer explains the missing-secret case, so it is only printed when that
// is actually what happened. Printed unconditionally it told a reader whose URL
// merely lacked a slash that a secret had gone missing — the wrong cause named,
// which is the fault this file has now been re-opened for twice.
let anyEmpty = false;

for (const { name, breaks, shape } of REQUIRED) {
  const value = env[name] ?? "";
  // Emptiness is judged trimmed, so a whitespace-only value counts as empty and
  // gets the message that fits it. Everything the trim would have hidden is
  // then caught by PRINTABLE below, on the RAW value, because the raw value is
  // what gets inlined.
  if (!value.trim()) {
    errors.push(`${name} is missing or empty\n      ${breaks}`);
    anyEmpty = true;
    continue;
  }
  // Its own cause, so its own consequence: the value is present and ships as
  // written — nothing is eliminated, it simply is not the value that was meant.
  if (!PRINTABLE.test(value)) {
    errors.push(
      `${name} contains a space or a character that is not printable ASCII\n` +
        `      it is inlined exactly as written, so what the browser gets is not what you\n` +
        `      set — and an invisible character anywhere in a URL stops it parsing at all`,
    );
    continue;
  }
  const bad = shape?.(value);
  if (bad) errors.push(`${name} ${bad.problem}\n      ${bad.breaks}`);
}

if (errors.length) {
  console.error(`✗ env (${errors.length} of ${REQUIRED.length} unusable)`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  Locally these come from .env — see CLAUDE.md for the full list.`);
  console.error(`  On deploy they come from GitHub Secrets, written to .env by`);
  console.error(`  deploy-all.yml's "Create env file" step.`);
  if (anyEmpty) {
    console.error(`  A secret that has been renamed or never created interpolates to an empty`);
    console.error(`  string, which is what "missing or empty" above means on a deploy.`);
  }
  process.exit(1);
}

console.log(`✓ env (${REQUIRED.length} PUBLIC_ variables present)`);
