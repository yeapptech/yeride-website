// Required PUBLIC_* variables — a missing one fails the build instead of
// shipping a page that cannot work.
// Wayfinder #59.
//
// WHY THIS EXISTS. Astro inlines `import.meta.env.PUBLIC_*` at BUILD time. When
// the value is empty, Vite substitutes `undefined` and esbuild then deletes
// every branch that depended on it. Measured against vite 6.4.1 with Astro's
// `envPrefix: "PUBLIC_"`, on the shape of the pre-registration handler: with
// PUBLIC_API_URL set the built bundle contains `v1/auth/register`; with it
// empty the fetch is gone from the output entirely and only the "is not set"
// branch survives. The page still builds, still renders, still shows a submit
// button, and can never submit. Nothing goes red.
//
// The production trigger is precisely the EMPTY case, not the undefined one:
// deploy-all.yml's "Create env file" step writes
// `PUBLIC_API_URL=${{ secrets.PUBLIC_API_URL }}`, and a secret that does not
// exist interpolates to the empty string. So a renamed or deleted secret
// produces a defined key with no value — which is why this checks for a
// non-empty value rather than for a defined key.
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
// Vite ships with Astro, and this script only ever runs where Astro is.
//
// WHAT IT CANNOT DO: it checks that a value EXISTS, never that it works. A
// wrong key, a revoked key, or a URL pointing at the wrong environment all pass
// here and fail in the browser.

import { loadEnv } from "vite";

// `npm run build` passes no --mode, so `astro build` builds with Vite's
// "production" mode and the project root as envDir; astro.config.mjs overrides
// neither, nor the "PUBLIC_" prefix.
const env = loadEnv("production", process.cwd(), "PUBLIC_");

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
    shape: (v) =>
      v.endsWith("/") || {
        problem:
          "must end with a trailing slash, and nothing after it — not even a space —\n" +
          "      because the form appends `v1/auth/register` to it",
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
  {
    name: "PUBLIC_FIREBASE_API_KEY",
    breaks: "the estimateFares callable cannot be reached, so no fare is ever quoted",
  },
  {
    name: "PUBLIC_FIREBASE_AUTH_DOMAIN",
    breaks: "the estimateFares callable cannot be reached, so no fare is ever quoted",
  },
  {
    name: "PUBLIC_FIREBASE_PROJECT_ID",
    breaks: "the estimateFares callable cannot be reached, so no fare is ever quoted",
  },
  {
    name: "PUBLIC_FEE_SCHEDULE_URL",
    breaks:
      "getFeeSchedule throws before it fetches, so /fees and /es/fees render their\n" +
      "      designed error state on every visit and publish no rate card",
  },
];

const errors = [];

for (const { name, breaks, shape } of REQUIRED) {
  const value = env[name] ?? "";
  // Emptiness is judged trimmed — a whitespace-only value is an empty one. The
  // SHAPE is judged raw, because that is what gets inlined: dotenv keeps
  // whitespace inside quotes, so `"https://api.yeride.com/ "` would pass a
  // trimmed slash test and then build a URL with a space in the middle of it.
  if (!value.trim()) {
    errors.push(`${name} is missing or empty\n      ${breaks}`);
    continue;
  }
  const bad = shape?.(value);
  if (bad && bad !== true) {
    errors.push(`${name} ${bad.problem}\n      ${bad.breaks}`);
  }
}

if (errors.length) {
  console.error(`✗ env (${errors.length} of ${REQUIRED.length} unusable)`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  Locally these come from .env — see CLAUDE.md for the full list.`);
  console.error(`  On deploy they come from GitHub Secrets, written to .env by`);
  console.error(`  deploy-all.yml's "Create env file" step. A secret that has been renamed`);
  console.error(`  or never created interpolates to an empty string, which is this failure.`);
  process.exit(1);
}

console.log(`✓ env (${REQUIRED.length} PUBLIC_ variables present)`);
