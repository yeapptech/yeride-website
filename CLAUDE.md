# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YeRide website — a static marketing, pre-registration, and fare-estimate site for a community-driven ridesharing platform. Astro 5, static output, deployed to GitHub Pages at https://www.yeride.com.

## Commands

```bash
npm run dev        # Dev server at http://localhost:4321
npm run checks     # Route parity + copy gate (both fast, no deps)
npm run build      # npm run checks + astro check (type-check) + astro build → dist/
npm run preview    # Preview production build locally
```

No test runner and no linter are configured. `npm run build` is the only automated verification gate. It runs three things in order, and any one of them fails the build:

1. **`scripts/check-route-parity.mjs`** — every route under `src/pages` has its `/es/` twin. `404` and `redirect` are exempt by name (single file, language switched client-side). Routes whose twin is not built yet sit in a `PENDING` map naming the ticket that retires them; an entry whose twin now exists fails, so the list cannot go stale.
2. **`scripts/check-copy-gate.mjs`** — gated and never-claimed strings (`docs/copy-map.md` §5, on the unmerged `copy-map/en-es` branch) must not reach the site. Scans `src/` and `public/`. See the script header for the escape hatch and, more importantly, for what the check *cannot* catch — it is a line matcher over source text, so a phrase broken across a tag, an entity or a newline slips it, as does copy arriving from the fee-schedule endpoint at runtime.
3. **`astro check`** — a type error fails the build.

`.github/workflows/checks.yml` runs items 1–2 on every pull request; `deploy-all.yml` runs the full chain on `main` and gates deployment on it.

## Environment Variables

All six are `PUBLIC_` (client-side) and are injected in CI from GitHub Secrets. Create a `.env` for local development:

```
PUBLIC_API_URL=https://api.yeride.com/          # must end with a trailing slash
PUBLIC_GOOGLE_MAPS_API_KEY=...
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FEE_SCHEDULE_URL=...                     # public getFeeSchedule endpoint (/fees)
```

Adding a new env var requires editing `.github/workflows/deploy-all.yml` (the "Create env file" step writes `.env` line by line) **and** adding the GitHub Secret — otherwise it is silently empty in production.

## Architecture

**Framework:** Astro 5 (static output, zero JS by default)
**Styling:** Tailwind CSS 3 via `@astrojs/tailwind`
**Deployment:** GitHub Actions → GitHub Pages on push to `main`

### Two independent backends

The site talks to two unrelated services; don't conflate them.

1. **Pre-registration** (`src/components/PreRegistrationForm.astro`) — plain `fetch` POST to `${PUBLIC_API_URL}v1/auth/register`, which is *yeride-admin-api*, not yeride-functions. It writes a `whitelist` row; it does not create an account. The form logic is a **bundled** `<script>` that imports its copy from `src/i18n/formCopy.ts` and reads `import.meta.env.PUBLIC_API_URL` directly (wayfinder #37 replaced the old `is:inline` + `define:vars` script). Because that value is **inlined at build time**, a missing `PUBLIC_API_URL` silently strips the whole submit path from the bundle — see #59.
2. **Fare estimates** (`src/components/FareEstimatePage.astro` + `src/lib/fareEstimate.ts`) — Firebase **callable function** `estimateFares`, hardcoded to region `us-east1` in `src/lib/firebase.ts`. Service area defaults to `us-fl-south-florida`. The component script loads Google Maps libraries (`maps`, `places`, `marker`, `routes`) via `@googlemaps/js-api-loader`, resolves pickup/dropoff, computes distance + duration, then calls `getEstimates()`.

   `estimateFares` also returns `appCharges`/`appChargesTotal`, and `ServiceEstimate` **deliberately does not declare them** (wayfinder #38) — they are the *driver's* cost in both payment flows, never the rider's, so a rider-facing page must not render them. The reasoning is written into `src/lib/fareEstimate.ts`; read it before adding the fields back.

Firebase Auth and Firestore are not used — only `firebase/functions`.

### Page structure — one layout, thin pages

Every page renders through the single `src/layouts/BaseLayout.astro` (wayfinder #35). **No
page declares its own `<html>`/`<head>`**, and no page carries inline header or footer
markup — `Header.astro` and `Footer.astro` have one caller each, `BaseLayout`. A navigation
or footer change is therefore one edit, in one place.

Redesigned routes keep the page file thin — `BaseLayout` plus one component that holds the
whole body (`HomePage`, `DriversPage`, `RidersPage`, `FeeSchedule`, `FareEstimatePage`) — with
the copy in `src/i18n/`. Follow that shape when adding a page. The pages still awaiting
their redesign ticket (`about`, `contact`) sit on `BaseLayout` with their
pre-redesign bodies inline.

`navBar.astro`, `src/data/navData.ts`, `src/styles/main.css` (Open Props from unpkg) and the
`https://cdn.tailwindcss.com` script tags were all removed by #35. Tailwind comes from the
`@astrojs/tailwind` integration and the brand preset alone — do not re-add a CDN tag.

Line endings are mixed and there is no `.gitattributes`: some older files are CRLF, most
newer ones LF. Editing a CRLF file with a tool that rewrites it wholesale will convert it
and bury your real change in a full-file diff.

### Other integrations

- **Tally.so** — embedded contact form on `/contact` (form ID `mJa5J7`)
- **Nunito** — the brand typeface, self-hosted via `@fontsource-variable/nunito` and imported once in `BaseLayout`; exposed as `font-brand`. The old per-page Google Fonts link to Inter is gone (#35)
- `src/pages/redirect.astro` — bare HTML that bounces to the `yeride://register` deep link
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
