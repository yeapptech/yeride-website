// The six required PUBLIC_* variables — one list, imported by everything that
// needs to know their names.
// Wayfinder #70.
//
// WHY THIS IS ITS OWN FILE. This list has two readers with incompatible
// requirements. `check-env.mjs` imports Vite to read the environment the way
// the build does, so it can only run after `npm ci` and only with the secrets
// present — deploy-time, never on a pull request. `check-env-example.mjs`
// compares these names against `.env.example` and needs no dependencies at all,
// so it runs in `npm run checks` on every PR. Neither can import the other
// without dragging its constraints along, so the list they must agree on lives
// in a third file that has no constraints of its own.
//
// That is the same discipline #57 applied to the copy-gate pattern list and #68
// to the normaliser: a list present in one gate and absent from the other reads
// as covered when it is not. Two copies of these six names would drift the
// moment a seventh variable is added, and the drift would be invisible — both
// files would still pass, each checking its own half.
//
// NOTHING VITE-SHAPED BELONGS HERE. This file must stay importable with no
// install, or `npm run checks` stops being dependency-free and #41's design
// goal goes with it. It is data and one pure function; keep it that way.
//
// ADDING A VARIABLE is a four-place change: this list, the "Create env file"
// step in .github/workflows/deploy-all.yml, the GitHub Secret, and
// `.env.example`. Miss `.env.example` and `npm run checks` fails on the PR;
// miss the workflow and `.claude/hooks/env-var-drift.sh` says so; miss the
// secret and `check-env.mjs` fails the deploy on the empty string it becomes.

// All three Firebase values feed one `initializeApp` call, so any one of them
// missing has the same single consequence.
const NO_CALLABLE = "the estimateFares callable cannot be reached, so no fare is ever quoted";

export const REQUIRED = [
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
