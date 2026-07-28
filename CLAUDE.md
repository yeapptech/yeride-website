# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YeRide website — a static marketing, pre-registration, and fare-estimate site for a community-driven ridesharing platform. Astro 5, static output, deployed to GitHub Pages at https://www.yeride.com.

## Commands

```bash
npm run dev        # Dev server at http://localhost:4321
npm run build      # astro check (type-check) + astro build → dist/
npm run preview    # Preview production build locally
```

No test runner and no linter are configured. `npm run build` is the only automated verification gate — `astro check` runs first, so a type error fails the build.

## Environment Variables

All five are `PUBLIC_` (client-side) and are injected in CI from GitHub Secrets. Create a `.env` for local development:

```
PUBLIC_API_URL=https://api.yeride.com/          # must end with a trailing slash
PUBLIC_GOOGLE_MAPS_API_KEY=...
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
```

Adding a new env var requires editing `.github/workflows/deploy-all.yml` (the "Create env file" step writes `.env` line by line) **and** adding the GitHub Secret — otherwise it is silently empty in production.

## Architecture

**Framework:** Astro 5 (static output, zero JS by default)
**Styling:** Tailwind CSS 3 via `@astrojs/tailwind`
**Deployment:** GitHub Actions → GitHub Pages on push to `main`

### Two independent backends

The site talks to two unrelated services; don't conflate them.

1. **Pre-registration** (`src/components/PreRegistrationForm.astro`) — plain `fetch` POST to `${PUBLIC_API_URL}v1/auth/register`. The form logic lives in one large `is:inline` script that receives the URL via `define:vars`, so it is *not* bundled and cannot use imports.
2. **Fare estimates** (`src/pages/fare-estimate.astro` + `src/lib/fareEstimate.ts`) — Firebase **callable function** `estimateFares`, hardcoded to region `us-east1` in `src/lib/firebase.ts`. Service area defaults to `us-fl-south-florida`. The page script loads Google Maps libraries (`maps`, `places`, `marker`, `routes`) via `@googlemaps/js-api-loader`, resolves pickup/dropoff, computes distance + duration, then calls `getEstimates()`.

`firebase-admin` is in `package.json` but unused in `src/`. Firebase Auth and Firestore are not used — only `firebase/functions`.

### Page structure is inconsistent — check before editing shared UI

There is no single layout. Each page declares its own `<html>`/`<head>`:

- `src/pages/404.astro` — the **only** page using `BaseLayout.astro`, which is also the only consumer of `navBar.astro`, `src/data/navData.ts`, and `src/styles/main.css` (Open Props from unpkg). `navData.ts` lists routes (`ride`, `drive`, `register`) that don't exist.
- `src/pages/index.astro` — fully self-contained, with its own inline header and footer markup (does *not* use the `Header`/`Footer` components).
- `about`, `contact`, `privacy-policy`, `fare-estimate` — self-contained `<html>` importing the `Header` and `Footer` components.

Consequence: a navigation or footer change usually needs edits in **both** `src/components/Header.astro` / `Footer.astro` **and** the inline copies in `index.astro`.

Also: `index`, `about`, `contact`, and `privacy-policy` load Tailwind from `https://cdn.tailwindcss.com` in `<head>`, *on top of* the `@astrojs/tailwind` build. `fare-estimate.astro` relies on the integration alone. When adding a page, match whichever surrounding page you're copying rather than assuming the integration is enough.

### Other integrations

- **Tally.so** — embedded contact form on `/contact` (form ID `mJa5J7`)
- **Google Fonts** — Inter (400, 600, 700), linked per page
- `src/pages/redirect.astro` — bare HTML that bounces to the `yeride://register` deep link

## Coding Conventions

- Astro components (`.astro`) with scoped `<style>` tags
- Tailwind utility classes directly; **never use `@apply`**
- Minimize client-side JS; `client:*` directives only when hydration is genuinely needed
- Mobile-first responsive design (`sm`, `md`, `lg`)
- Conventional Commits (`feat`, `fix`, `docs`, `chore`, …)

## Further Documentation

`docs/` holds longer-form guides: `architecture.md`, `components.md`, `api-integration.md`, `deployment.md`, `getting-started.md`, `contributing.md`.
