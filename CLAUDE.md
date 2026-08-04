# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YeRide website — a static marketing, pre-registration, and fare-estimate site for a community-driven ridesharing platform. Astro 5, static output, deployed to GitHub Pages at https://www.yeride.com.

## Commands

```bash
npm run dev        # Dev server at http://localhost:4321
npm run checks     # Route parity + copy gate (both fast, no deps)
npm run build      # npm run checks + env check + astro check + astro build → dist/ + dist copy gate
npm run preview    # Preview production build locally
```

No test runner and no linter are configured, and `npm run build` is the only automated verification gate. The one exception is a set of unit-style controls for the §5 pattern list — `node scripts/copy-gate-patterns.test.mjs`, plain Node, no deps — which nothing runs for you: **run it by hand whenever `scripts/copy-gate-patterns.mjs` changes** (#75). Its second list is the valuable half: a locked-price pattern is easy to widen and easy to widen too far, and every "must not fire" entry is real copy from this site.

`npm run build` runs five things in order, and any one of them fails the build:

1. **`scripts/check-route-parity.mjs`** — every route under `src/pages` has its `/es/` twin. `404` and `redirect` are exempt by name (single file, language switched client-side). Routes whose twin is not built yet sit in a `PENDING` map naming the ticket that retires them; an entry whose twin now exists fails, so the list cannot go stale.
2. **`scripts/check-copy-gate.mjs`** — gated and never-claimed strings (`docs/copy-map.md` §5, on the unmerged `copy-map/en-es` branch) must not reach the site. Scans `src/` and `public/` and fails on a Greek or Cyrillic letter, which in EN/ES copy is a homoglyph hiding a gated word. It reads each file **twice**: once raw, line by line, and once normalised through `scripts/copy-gate-normalise.mjs` — the same reading machine item 5 uses (#68), so a phrase broken across a tag, a *known* entity, a JS escape or a newline fails here, at the point of authorship, rather than after a merge. A normalised hit still reports a line, a range when the phrase crosses one, and names the view that found it. It declines the two views that can *invent* a phrase, so no `copy-gate-allow` pragma has to bless a phantom; those stay item 5's. Two limits are worth knowing before trusting it: the normalised reading only ever **accuses** — §5's one permitted exception, "no surge today", is a same-line lookahead, so splitting it fails the build on copy §3.4 allows (#82) — and the normaliser's tables are finite, so most of the invisible-character class, an unbounded or unterminated numeric reference, and a homoglyph written as an escape all still pass (#80). Files it skips are named as `not read:` on every run. Its value is the file-and-line failure at authorship time, and it owns the per-line `copy-gate-allow` escape hatch — which covers the line a match **starts** on; see the script header.
3. **`scripts/check-env.mjs`** — the six `PUBLIC_*` variables are present, non-empty and printable ASCII, and `PUBLIC_API_URL` ends with its slash. The printable-ASCII rule is a whitelist on purpose: an invisible character (a paste artifact like U+200E or U+00AD) survives `dotenv` and reaches the bundle, where it stops a URL parsing at all, and a blocklist of such characters cannot be finished. Astro inlines these at build time, so one that is not there becomes a falsy literal — `undefined` where the key is absent, `""` where it is present but empty — and Rollup then folds away the branch that tested it: an empty `PUBLIC_API_URL` ships a pre-registration form whose submit path no longer exists in the bundle, off a green build. The production trigger is the *empty* case, not the undefined one — a renamed or deleted GitHub Secret interpolates to `""` in `deploy-all.yml`'s "Create env file" step. It reads the environment through Vite's own `loadEnv`, so it sees exactly what the build will see (`.env` → `.env.local` → `.env.production` → `.env.production.local` → `process.env`, with an empty value in a later source blanking a non-empty one from an earlier). It needs both `npm ci` and the secrets, so it cannot join `checks.yml`. Run it alone with `npm run check:env`.
4. **`astro check`** — a type error fails the build.
5. **`scripts/check-dist-copy-gate.mjs`** — the same §5 list run over `dist/` **after** `astro build`, through six views of each markup file (two of which the source gate declines because they can fabricate). Both gates import **one** pattern list, `scripts/copy-gate-patterns.mjs`, and **one** normaliser, `scripts/copy-gate-normalise.mjs` — never two of either, because a pattern or a transform present in one gate and absent from the other reads as covered when it is not. This is the layer that measures the actual promise — a forbidden claim must not reach the shipped site. Since #68 gave the source gate the same reading, what only this gate can still see is narrower and worth naming: **vendored** files this repo does not author; copy **composed by the build** out of parts innocent in the source (`{copy.lead} {copy.tail}` is two strings here and one phrase in the built HTML — the one residual a PR author hits by *accident*), including literal concatenation Rollup folds (`"insur" + "ance"`); and the two normalisation views that can invent a phrase, which the source gate declines and this gate blesses by hand. It also still reads file types the source gate does not (#81). Source pragmas are stripped by the build and cannot be seen from here, so it carries its **own** allowlist keyed to the hash-free path, the matched text and an exact count; an entry that stops matching, or matches a different number of times, fails. Run it alone with `npm run check:dist` (needs a `dist/`).

`.github/workflows/checks.yml` runs items 1–2 on every pull request — it is dependency-free by design, and items 3–5 all need `npm ci` against the private registry (item 3 reads the environment through Astro's own Vite), with item 3 additionally needing the secrets a PR does not have. `deploy-all.yml` runs the full chain on `main` and gates deployment on it, so items 3 and 5 are pre-deploy backstops rather than PR-time ones.

One further gate runs **outside `npm run build`**, because it needs the network:

- **`scripts/check-fee-labels.mjs`** — every charge id, service area and ride tier id `getFeeSchedule` publishes has a site-authored EN/ES label in `src/i18n/feeLabels.ts` (tiers were added by #65: they name the rate card's rows on `/fees` **and** the result list on `/fare-estimate`, which reads the same `rideServices` documents through `estimateFares`). It asks the live endpoint (all areas, not just the default), so it cannot live in `npm run checks` without coupling every local build and every PR to a third party's uptime. It runs on deploy (`deploy-all.yml`, before the build) and daily on a schedule (`fee-label-drift.yml`, which opens an issue on drift, since drift arrives from the admin console between deploys). It **fails on drift and skips when it cannot ask** — a missing `PUBLIC_FEE_SCHEDULE_URL` or an unreachable endpoint prints a `SKIPPED` line and exits 0. Run it by hand with `node scripts/check-fee-labels.mjs [url]`.

## Environment Variables

All six are `PUBLIC_` (client-side) and are injected in CI from GitHub Secrets. All six are **required**: `npm run build` fails on a missing or empty one (gate 3 above). `npm run dev`, `npm run checks` and `npx astro check` need none of them, so a docs- or copy-only change can still be type-checked without keys. Create a `.env` for local development:

```
PUBLIC_API_URL=https://api.yeride.com/          # must end with a trailing slash
PUBLIC_GOOGLE_MAPS_API_KEY=...
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FEE_SCHEDULE_URL=...                     # public getFeeSchedule endpoint (/fees)
```

Adding a new env var requires editing `.github/workflows/deploy-all.yml` (the "Create env file" step writes `.env` line by line) **and** adding the GitHub Secret. A var that is required for a page to work also belongs in `REQUIRED` in `scripts/check-env.mjs`, with what breaks when it is absent — that list is what stops a missing secret from being silently empty in production.

## Architecture

**Framework:** Astro 5 (static output, zero JS by default)
**Styling:** Tailwind CSS 3 via `@astrojs/tailwind`
**Deployment:** GitHub Actions → GitHub Pages on push to `main`

### Two independent backends

The site talks to two unrelated services; don't conflate them.

1. **Pre-registration** (`src/components/PreRegistrationForm.astro`) — plain `fetch` POST to `${PUBLIC_API_URL}v1/auth/register`, which is *yeride-admin-api*, not yeride-functions. It writes a `whitelist` row; it does not create an account. The form logic is a **bundled** `<script>` that imports its copy from `src/i18n/formCopy.ts` and reads `import.meta.env.PUBLIC_API_URL` directly (wayfinder #37 replaced the old `is:inline` + `define:vars` script). Because that value is **inlined at build time**, an empty `PUBLIC_API_URL` strips the whole submit path from the bundle; `scripts/check-env.mjs` fails the build rather than let that ship (#59).
2. **Fare estimates** (`src/components/FareEstimatePage.astro` + `src/lib/fareEstimate.ts`) — Firebase **callable function** `estimateFares`, hardcoded to region `us-east1` in `src/lib/firebase.ts`. Service area defaults to `us-fl-south-florida`. The component script loads Google Maps libraries (`maps`, `places`, `marker`, `routes`) via `@googlemaps/js-api-loader`, resolves pickup/dropoff, computes distance + duration, then calls `getEstimates()`.

   `estimateFares` **no longer returns** `appCharges`/`appChargesTotal` — they were withdrawn from the endpoint (yeride-functions#47). `ServiceEstimate` had **deliberately declined to declare them** (wayfinder #38) because they are the *driver's* cost in both payment flows, never the rider's, and that refusal is precisely what the withdrawal was built on: yeride-functions#37 went looking for a reader of those fields, found this site declining them by name and no program anywhere reading them, and took the whole surface off the wire. The reasoning is written into `src/lib/fareEstimate.ts`; read it before adding the fields back.

Firebase Auth and Firestore are not used — only `firebase/functions`.

### Page structure — one layout, thin pages

Every page renders through the single `src/layouts/BaseLayout.astro` (wayfinder #35). **No
page declares its own `<html>`/`<head>`**, and no page carries inline header or footer
markup — `Header.astro` and `Footer.astro` have one caller each, `BaseLayout`. A navigation
or footer change is therefore one edit, in one place.

Redesigned routes keep the page file thin — `BaseLayout` plus one component that holds the
whole body (`HomePage`, `DriversPage`, `RidersPage`, `FeeSchedule`, `FareEstimatePage`) — with
the copy in `src/i18n/`. Follow that shape when adding a page. One page still awaits its
redesign ticket — `about` — and sits on `BaseLayout` with its pre-redesign body inline; it is
[#85](https://github.com/yeapptech/yeride-website/issues/85), blocked outside this repo on
yeapptech/yeride-brand#22's authored ES identity paragraph.

`/404` and `/redirect` are the two exceptions to "every route ships EN and ES": they are one
file each, serving **both** languages, because GitHub Pages answers every missing path with a
single root `404.html` and `/es/404` is therefore unreachable. `BaseLayout`'s `bilingual`
prop ships both languages of the header and footer alongside the page's own two halves and
reveals one from `location.pathname` — chrome included, since Spanish content under English
navigation is the half-translated page #62 and #65 were re-opened over. The mechanism, and
the two ways it fails silently, are in `docs/components.md` under `BaseLayout`.

`navBar.astro`, `src/data/navData.ts`, `src/styles/main.css` (Open Props from unpkg) and the
`https://cdn.tailwindcss.com` script tags were all removed by #35. Tailwind comes from the
`@astrojs/tailwind` integration and the brand preset alone — do not re-add a CDN tag.

Line endings are mixed and there is no `.gitattributes`: some older files are CRLF, most
newer ones LF. Editing a CRLF file with a tool that rewrites it wholesale will convert it
and bury your real change in a full-file diff.

### Other integrations

- **Tally.so** — embedded contact form, **one per language**, mapped in
  `src/components/ContactPage.astro` (`/contact` is `mJa5J7`). Tally has no runtime
  localisation and copy-map §3.7 requires the Spanish questions authored rather than
  translated, so `/es/contact` will embed its own form once it exists (it does not yet —
  copy-map §6.5). Three build-time throws guard it: the **route** must agree with the `lang`
  prop (keying on `lang` alone let an `/es/` page render `lang="en"` and ship the English form
  off a green build), the id must be shaped like a Tally id, and no two languages may share
  one. None of them can catch a well-formed id that is simply the wrong form
- **Nunito** — the brand typeface, self-hosted via `@fontsource-variable/nunito` and imported once in `BaseLayout`; exposed as `font-brand`. The old per-page Google Fonts link to Inter is gone (#35)
- `src/pages/redirect.astro` — bounces to the `yeride://register` deep link. Not bare HTML:
  it renders through `BaseLayout` like everything else (#35), in `bilingual` mode (#39)
- **URL aliases the mobile app depends on** — `redirects` in `astro.config.mjs` maps `/privacy`
  → `/privacy-policy`, `/es/privacy` → `/es/privacy-policy` and `/support` → `/contact`
  (wayfinder #44). These are not cosmetic: yeride-mobile links `yeride.com/privacy` in-app and
  submits it as the store-listing privacy URL, and a missing `/support` was a 2025 App Store
  rejection. Do not remove or rename them without changing the app first. They live in the
  config, not in `src/pages`, so the route-parity check is not asked to find `/es/` twins for
  aliases.

## Coding Conventions

- Astro components (`.astro`) with scoped `<style>` tags
- Tailwind utility classes directly; **never use `@apply`**
- Minimize client-side JS; `client:*` directives only when hydration is genuinely needed
- Mobile-first responsive design (`sm`, `md`, `lg`)
- Conventional Commits (`feat`, `fix`, `docs`, `chore`, …)

## Further Documentation

`docs/` holds longer-form guides: `architecture.md`, `components.md`, `api-integration.md`, `deployment.md`, `getting-started.md`, `contributing.md`.
