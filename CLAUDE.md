# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YeRide website — a static marketing, pre-registration, and fare-estimate site for a community-driven ridesharing platform. Astro 5, static output, deployed to GitHub Pages at https://www.yeride.com.

## Commands

```bash
npm run dev        # Dev server at http://localhost:4321
npm run checks     # Route parity + copy gate + env name parity, x2 (all fast, no deps)
npm run build      # npm run checks + env check + astro check + astro build → dist/ + dist copy gate
npm run preview    # Preview production build locally
```

No test runner and no linter are configured, and `npm run build` is the only automated verification gate. The one exception is a set of unit-style controls for the §5 pattern list — `node scripts/copy-gate-patterns.test.mjs`, plain Node, no deps — which nothing runs for you: **run it by hand whenever `scripts/copy-gate-patterns.mjs` changes** (#75). Its second list is the valuable half: a locked-price pattern is easy to widen and easy to widen too far, and every "must not fire" entry is real copy from this site.

`npm run build` runs seven things in order, and any one of them fails the build:

1. **`scripts/check-route-parity.mjs`** — every route under `src/pages` has its `/es/` twin. `404` and `redirect` are exempt by name (single file, language switched client-side). Routes whose twin is not built yet sit in a `PENDING` map naming the ticket that retires them; an entry whose twin now exists fails, so the list cannot go stale.
2. **`scripts/check-copy-gate.mjs`** — gated and never-claimed strings (`docs/copy-map.md` §5, on the unmerged `copy-map/en-es` branch) must not reach the site. Scans `src/` and `public/` and fails on a Greek or Cyrillic letter, which in EN/ES copy is a homoglyph hiding a gated word. It reads each file **twice**: once raw, line by line, and once normalised through `scripts/copy-gate-normalise.mjs` — the same reading machine item 7 uses (#68), so a phrase broken across a tag, a *known* entity, a JS escape or a newline fails here, at the point of authorship, rather than after a merge. A normalised hit still reports a line, a range when the phrase crosses one, and names the view that found it. It declines the two views that can *invent* a phrase, so no `copy-gate-allow` pragma has to bless a phantom; those stay item 7's. Two limits are worth knowing before trusting it: the normalised reading only ever **accuses** — §5's one permitted exception, "no surge today", is a same-line lookahead, so splitting it fails the build on copy §3.4 allows (#82) — and the normaliser's tables are finite, so most of the invisible-character class, an unbounded or unterminated numeric reference, and a homoglyph written as an escape all still pass (#80). Files it skips are named as `not read:` on every run. Its value is the file-and-line failure at authorship time, and it owns the per-line `copy-gate-allow` escape hatch — which covers the line a match **starts** on; see the script header.
3. **`scripts/check-env-example.mjs`** — `.env.example` and `scripts/env-required.mjs` name the same six variables, as an exact set in both directions (#70). It exists because `.env.example` only helps while it stays true: one that has quietly fallen a variable behind is *worse* than none, since a contributor copies it, gets a `.env` that looks complete, and fails at `npm run build` on a variable nobody told them about. It reads **names only and never a value** — that is what keeps it from being a third answer to the question `check-env.mjs` already answers (#72's subject). It cannot say what the build will see: no precedence across `.env.local` and the mode files, no `process.env` overlay, no quote stripping. It is asking a different question about a different file — `.env.example` is committed, hand-written, and loaded by nothing; Vite never reads it. Needing neither Vite nor secrets, it runs on a pull request, which is where the drift it catches is introduced. Strict in both directions on purpose: a superset rule would let a new variable reach `.env.example` and `deploy-all.yml` while missing `REQUIRED`, which is the exact drift #70 was filed over.
4. **`scripts/check-deploy-env.mjs`** — the "Create env file" step in `.github/workflows/deploy-all.yml` writes exactly the `REQUIRED` names, each from its own same-named secret, into `.env`, truncating once and appending after (#90). That step is the **only** thing that puts a value into the deploy's `.env`, and it was the third place a required name must appear with nothing asserting it. Miss the line and items 1–3 all pass, your local build passes off your own `.env`, and item 5 then fails **on `main`, after the merge**, reporting a missing *secret* when the secret exists and the workflow line does not — the cause named is not the cause. It does **not** parse YAML, because this job installs nothing (#41); it anchors on the step by name and reads the `echo` lines in the block that follows. Anchoring is what keeps a YAML *sample* elsewhere in the repo (#71) from being read as the real thing, and a leading `#` inside a `run:` block is a shell comment, so skipping those lines is correct rather than a blind spot. It recognises **one** line shape, and a line it cannot read is reported as unrecognised on its own line number rather than counted as a missing variable — naming the wrong cause is the fault this gate exists to remove. It also asserts the redirection (`>` once, then `>>`: a second `>` writes a `.env` holding one variable, and the deploy then fails naming five secrets that all exist) and that each name is written from `secrets.<the same name>` (a crossed pair is non-empty and printable, so it passes item 5 and fails only in the browser). The fourth place — the **GitHub Secret itself** — no gate here can see; item 5 still catches it on deploy, and with this gate green "missing or empty" there now means the secret.
5. **`scripts/check-env.mjs`** — the six `PUBLIC_*` variables are present, non-empty and printable ASCII, and `PUBLIC_API_URL` ends with its slash. The printable-ASCII rule is a whitelist on purpose: an invisible character (a paste artifact like U+200E or U+00AD) survives `dotenv` and reaches the bundle, where it stops a URL parsing at all, and a blocklist of such characters cannot be finished. Astro inlines these at build time, so one that is not there becomes a falsy literal — `undefined` where the key is absent, `""` where it is present but empty — and Rollup then folds away the branch that tested it: an empty `PUBLIC_API_URL` ships a pre-registration form whose submit path no longer exists in the bundle, off a green build. The production trigger is the *empty* case, not the undefined one — a renamed or deleted GitHub Secret interpolates to `""` in `deploy-all.yml`'s "Create env file" step. It reads the environment through Vite's own `loadEnv`, so it sees exactly what the build will see (`.env` → `.env.local` → `.env.production` → `.env.production.local` → `process.env`, with an empty value in a later source blanking a non-empty one from an earlier). It needs both `npm ci` and the secrets, so it cannot join `checks.yml`. Run it alone with `npm run check:env`.
6. **`astro check`** — a type error fails the build.
7. **`scripts/check-dist-copy-gate.mjs`** — the same §5 list run over `dist/` **after** `astro build`, through six views of each markup file (two of which the source gate declines because they can fabricate). Both gates import **one** pattern list, `scripts/copy-gate-patterns.mjs`, and **one** normaliser, `scripts/copy-gate-normalise.mjs` — never two of either, because a pattern or a transform present in one gate and absent from the other reads as covered when it is not. This is the layer that measures the actual promise — a forbidden claim must not reach the shipped site. Since #68 gave the source gate the same reading, what only this gate can still see is narrower and worth naming: **vendored** files this repo does not author; copy **composed by the build** out of parts innocent in the source (`{copy.lead} {copy.tail}` is two strings here and one phrase in the built HTML — the one residual a PR author hits by *accident*), including literal concatenation Rollup folds (`"insur" + "ance"`); and the two normalisation views that can invent a phrase, which the source gate declines and this gate blesses by hand. It also still reads file types the source gate does not (#81). Source pragmas are stripped by the build and cannot be seen from here, so it carries its **own** allowlist keyed to the hash-free path, the matched text and an exact count; an entry that stops matching, or matches a different number of times, fails. Run it alone with `npm run check:dist` (needs a `dist/`).

`.github/workflows/checks.yml` runs items 1–4 on every pull request — it is dependency-free by design, and items 5–7 all need `npm ci` against the private registry (item 5 reads the environment through Astro's own Vite), with item 5 additionally needing the secrets a PR does not have. `deploy-all.yml` runs the full chain on `main` and gates deployment on it, so items 5 and 7 are pre-deploy backstops rather than PR-time ones.

Items 3, 4 and 5 share **one** list of variable names, `scripts/env-required.mjs` — never three, for the reason #57 gives for one pattern list and #68 for one normaliser. It is data and one pure function with no imports, because items 3 and 4 must stay installable-free; the Vite-shaped knowledge stays in `check-env.mjs`. Copies of six names would drift the moment a seventh arrived, and every gate would still pass, each checking its own half. Items 3 and 4 are separate scripts over that one list rather than one script with two legs: they read files of different kinds — a committed dotenv file and a YAML `run:` block — and `check-env-example.mjs` makes a structural claim about never becoming a third reader of the *environment* (#72) that a workflow parser inside it would falsify. Two gates over one hub cannot drift; two copies of the hub can.

One further gate runs **outside `npm run build`**, because it needs the network:

- **`scripts/check-fee-labels.mjs`** — every charge id, service area and ride tier id `getFeeSchedule` publishes has a site-authored EN/ES label in `src/i18n/feeLabels.ts` (tiers were added by #65: they name the rate card's rows on `/fees` **and** the result list on `/fare-estimate`, which reads the same `rideServices` documents through `estimateFares`). It asks the live endpoint (all areas, not just the default), so it cannot live in `npm run checks` without coupling every local build and every PR to a third party's uptime. It runs on deploy (`deploy-all.yml`, before the build) and daily on a schedule (`fee-label-drift.yml`, which opens an issue on drift, since drift arrives from the admin console between deploys). It **fails on drift and skips when it cannot ask** — a missing `PUBLIC_FEE_SCHEDULE_URL` or an unreachable endpoint prints a `SKIPPED` line and exits 0. Run it by hand with `node scripts/check-fee-labels.mjs [url]`.

## Environment Variables

All six are `PUBLIC_` (client-side) and are injected in CI from GitHub Secrets. All six are **required**: `npm run build` fails on a missing or empty one (gate 5 above). `npm run dev`, `npm run checks` and `npx astro check` need none of them, so a docs- or copy-only change can still be type-checked without keys.

**The list is `.env.example`** — committed (`.gitignore` carries `.env*` with `!.env.example`), and the only place the six names and their shapes are written as a list. `cp .env.example .env` and fill it in. This file used to restate them and six other documents restated them again; #70 ended that, because the list existing in seven places and being authoritative in one is not a hypothetical cost — #69 needed three review rounds to get those seven right, and round three had to abandon reading from memory and sweep with `grep`. What stays here is what a list cannot carry: why each variable exists and what specifically breaks without it, which is gate 5 above and the `breaks` strings in `scripts/env-required.mjs`.

Only `PUBLIC_API_URL` carries a real value in `.env.example`; the other five are secrets on deliberately invalid placeholders. Those placeholders do **not** fail the build, and that is worth knowing before trusting a green one: they are non-empty, printable ASCII and well-formed, which is all gate 5 asks — it checks that a value exists, never that it works. `cp .env.example .env && npm run build` is green against five fake keys and serves a site with no map, no fare and `/fees` in its error state. The file gets you a build, not a working site. That real value is **not** `https://api.yeride.com/`, which every one of those seven documents used to show and which is **NXDOMAIN** — it has never resolved, so a contributor who followed the docs was configuring a host that does not exist. Production posts to a Cloud Run hostname, already public: Astro inlines it at build time and it is readable in the shipped HTML of `/drivers/`.

Adding a new env var is a **four-place** change, and three of the four are now asserted on the pull request. It requires editing `.github/workflows/deploy-all.yml` (the "Create env file" step writes `.env` line by line, `>` then `>>`) **and** adding the GitHub Secret. A var that is required for a page to work also belongs in `REQUIRED` in `scripts/env-required.mjs`, with what breaks when it is absent — that list is what stops a missing secret from being silently empty in production — **and** in `.env.example`. Gate 3 asserts `.env.example` against `REQUIRED`, gate 4 asserts the workflow step against `REQUIRED` (#90), and both run on every pull request. The **secret** is the fourth place and the only one nothing here can see; gate 5 catches it on the deploy, off the empty string it interpolates to.

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

- **No contact form, and no Tally** — `/contact` publishes `support@yeride.com` and nothing
  else (#39 amended copy-map §3.7). The embedded Tally form was dropped: its questions lived
  inside Tally, the last user-facing copy on this site outside the repo and invisible to both
  copy gates, and Tally has no runtime localisation, so `/es/contact` would have needed a
  second form authored and kept in sync by hand forever. Removing it also deleted a named
  processor from the privacy policy. **Do not re-add a third-party form embed.** If
  structured intake is wanted, copy `PreRegistrationForm.astro` — markup and per-field EN/ES
  copy in `src/i18n/`, posting to an endpoint YeRide owns
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
