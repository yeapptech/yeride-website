# Architecture

This document describes the technical architecture of the YeRide website.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| [Astro](https://astro.build) 5.x | Static site generator |
| [TypeScript](https://www.typescriptlang.org) 5.x | Type safety |
| [Tailwind CSS](https://tailwindcss.com) 3.x | Utility-first styling |
| [Firebase](https://firebase.google.com) 11.x | `firebase/functions` **only** — one callable, `estimateFares`. Auth and Firestore are not used |
| `@yeapptech/yeride-brand` | The design system: Tailwind preset, tokens, marks. Private package; binding docs live in its repo |

## Directory Structure

```
yeride-website/
├── src/
│   ├── components/           # One body component per route, plus the chrome
│   │   ├── Header.astro      # Site header — one caller, BaseLayout
│   │   ├── Footer.astro      # Site footer — one caller, BaseLayout
│   │   ├── HomePage.astro    # The whole body of / and /es/
│   │   ├── DriversPage.astro
│   │   ├── RidersPage.astro
│   │   ├── FeeSchedule.astro       # /fees — fetches the live rate card
│   │   ├── FareEstimatePage.astro  # /fare-estimate — Maps + estimateFares
│   │   ├── LegalDocument.astro     # /privacy-policy and /terms, both languages
│   │   ├── ContactPage.astro
│   │   ├── AboutPage.astro         # /about — prose page, ContactPage's measure
│   │   ├── NotFoundPage.astro      # /404 — renders EN and ES at once
│   │   ├── RedirectPage.astro      # /redirect — same
│   │   ├── AvailabilityBlock.astro # Shared block (copy-map §2.1)
│   │   └── PreRegistrationForm.astro
│   │
│   ├── i18n/                 # ALL copy, EN/ES, verbatim from docs/copy-map.md
│   │   ├── homeCopy.ts  audienceCopy.ts  feesCopy.ts
│   │   ├── fareEstimateCopy.ts  legalCopy.ts  utilityCopy.ts
│   │   ├── aboutCopy.ts  formCopy.ts
│   │   └── feeLabels.ts      # Site-authored names for backend charge/area/tier ids
│   │
│   ├── lib/
│   │   ├── firebase.ts       # firebase/functions only — no Auth, no Firestore
│   │   ├── fareEstimate.ts   # estimateFares callable + its rider-facing contract
│   │   ├── feeSchedule.ts    # getFeeSchedule fetch + response contract
│   │   └── serviceArea.ts    # Which market a pickup is quoted at (#73), three states
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro  # The ONLY layout. Every page renders through it
│   │
│   └── pages/                # File-based routing — thin files, EN + /es/ twin
│       ├── index.astro  drivers.astro  riders.astro  fees.astro
│       ├── fare-estimate.astro  about.astro  contact.astro
│       ├── privacy-policy.astro  terms.astro
│       ├── 404.astro         # Both languages, one file
│       ├── redirect.astro    # Both languages, one file
│       └── es/               # The mirrored tree, English slugs
│
├── public/                   # Static assets
│   ├── CNAME                 # Custom domain configuration
│   ├── .nojekyll             # Disable Jekyll on GitHub Pages
│   └── images/               # Image assets
│
├── scripts/                  # The build gates, their shared modules and
│                            # their controls. Not enumerated here — CLAUDE.md
│                            # is the list, and an enumeration drifts: this one
│                            # had fallen 11 files behind by #42.
│   ├── check-*.mjs           # One per gate; `*.test.mjs` are the control sets,
│   │                         # run by `npm run test:gates` (first, on every
│   │                         # `npm run checks`) rather than by hand
│   └── copy-gate-*.mjs       # The ONE pattern list, normaliser, file-type table
│                             # and pragma reader — both copy gates import these
│
├── docs/                     # The longer-form guides, and one thing that is
│                            # not a guide:
│   └── copy-map.md           # THE COPY SOURCE OF TRUTH — every string, EN/ES,
│                             # per page. Its §5 is the list both copy gates
│                             # enforce. Read before changing any copy.
│
├── .github/
│   └── workflows/
│       ├── checks.yml        # The control sets + gates 1-5, no deps. Every PR
│                             # AND every push outside main (#104)
│       ├── deploy-all.yml    # Full chain + deploy, on main
│       └── fee-label-drift.yml     # Daily fee-label check
│
└── Configuration files
    ├── astro.config.mjs      # Astro configuration + the mobile-app redirects
    ├── tailwind.config.mjs   # Brand preset
    ├── tsconfig.json         # TypeScript configuration
    └── package.json          # Dependencies and scripts
```

Favicons and fonts are not in `public/` — they come from the
`@yeapptech/yeride-brand` package and are imported in `BaseLayout`.

## Routing

Astro uses **file-based routing**. Each `.astro` file in `src/pages/` becomes a
route, and **every route ships in both languages** — the `/es/` tree mirrors the
English one with **English slugs** (`/fees` → `/es/fees`, never `/es/tarifas`).
`scripts/check-route-parity.mjs` fails the build on a missing twin.

| File | Route | ES twin |
|------|-------|---------|
| `src/pages/index.astro` | `/` | `/es/` |
| `src/pages/drivers.astro` | `/drivers` | `/es/drivers` |
| `src/pages/riders.astro` | `/riders` | `/es/riders` |
| `src/pages/fees.astro` | `/fees` | `/es/fees` |
| `src/pages/fare-estimate.astro` | `/fare-estimate` | `/es/fare-estimate` |
| `src/pages/privacy-policy.astro` | `/privacy-policy` | `/es/privacy-policy` |
| `src/pages/terms.astro` | `/terms` | `/es/terms` |
| `src/pages/contact.astro` | `/contact` | `/es/contact` |
| `src/pages/about.astro` | `/about` | `/es/about` |
| `src/pages/404.astro` | `/404` | **same file** |
| `src/pages/redirect.astro` | `/redirect` | **same file** |

`/404` and `/redirect` are the two exemptions. GitHub Pages answers every missing
path with a single root `404.html`, so `/es/404` is unreachable; both pages ship
**both** languages in one file and reveal one client-side from
`location.pathname` (`BaseLayout`'s `bilingual` mode). They are exempt from the
parity check by name.

Four further routes are **redirects declared in `astro.config.mjs`**, not files:
`/privacy` → `/privacy-policy`, `/es/privacy` → `/es/privacy-policy`,
`/support` → `/contact` and `/es/support` → `/es/contact`. The mobile app depends on them — it links
`yeride.com/privacy` in-app and submits it as the store-listing privacy URL, and
a missing `/support` was a 2025 App Store rejection. Do not remove or rename
them without changing the app first.

## Component Architecture

### Layout System

`BaseLayout.astro` is the **only** layout, and it owns everything above the page
content: `<html>`, `<head>`, the title and meta description, the canonical link,
the EN/ES `hreflang` alternates, the brand favicons, the Nunito import, and the
header and footer. **No page declares any of it.**

```astro
---
// src/pages/riders.astro — the model. Nothing else belongs in a page file.
import BaseLayout from "../layouts/BaseLayout.astro";
import RidersPage from "../components/RidersPage.astro";
---

<BaseLayout
  title="Pay what the ride is worth. | YeRide for riders"
  description="Published rates — base, miles, minutes. The same math every trip, and every fee published."
  lang="en"
  headerGround="yellow"
>
  <RidersPage lang="en" />
</BaseLayout>
```

Its props are documented in [components.md](./components.md); `headerGround`
picks the mark that is legal on that ground, and `alternates`/`bilingual` are for
`/404` and `/redirect` alone.

### Component Types

1. **The layout** — `BaseLayout.astro`. There is one.
2. **Chrome** — `Header`, `Footer`. One caller each, `BaseLayout`; a nav change
   is one edit.
3. **Body components** — one per route (`HomePage`, `DriversPage`, `RidersPage`,
   `FeeSchedule`, `FareEstimatePage`, `LegalDocument`, `ContactPage`,
   `AboutPage`). Each takes
   `lang` **alone** and resolves its own copy from `src/i18n/`. A page that
   passes resolved copy down as a prop breaks the contract. Half of that rule
   is enforced since #88 — `scripts/check-astro-prose.mjs` fails the build on
   literal prose in an `.astro` text node — and the prop half is not, because
   the gate reads text nodes only. `NotFoundPage` and
   `RedirectPage` take no props at all — they render both languages at once.
4. **Shared blocks** — `AvailabilityBlock`, `PreRegistrationForm`, used by more
   than one body component.

## Styling Approach

### Tailwind CSS

Utility classes directly, mobile-first. **Never `@apply`.** Colour, type and
spacing come from the brand preset, so the tokens are the vocabulary —
`bg-paper`, `text-ink`, `bg-cab-yellow`, `font-brand`, `tracking-headline`,
`tracking-caps` — not raw greys:

```astro
<div class="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6">
  <h1 class="font-extrabold tracking-headline text-[2rem] text-ink sm:text-[2.5rem]">
    Pay what the ride is worth.
  </h1>
</div>
```

### Global Styles

There is no global stylesheet. `src/styles/main.css` and its Open Props import
were deleted in wayfinder #35, along with the `cdn.tailwindcss.com` script tags
and the Google Fonts link to Inter — **do not re-add any of them**; each is
duplicate CSS and a flash of unstyled content.

What `BaseLayout` imports once, for the whole site:

```astro
import "@fontsource-variable/nunito";        // the brand typeface, self-hosted
import "@yeapptech/yeride-brand/tokens.css";  // the brand's CSS custom properties
```

### Configuration

Tailwind takes its theme from the brand package's preset — this repo defines no
colours or type scale of its own:

```javascript
import brandPreset from '@yeapptech/yeride-brand/tailwind-preset';

export default {
  presets: [brandPreset],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: { extend: {} },
  plugins: [],
}
```

`@yeapptech/yeride-brand` is a **private package** on GitHub Packages. Installing
needs the committed `.npmrc` plus an `NPM_TOKEN` (a classic PAT with
`read:packages`); CI reads it from an Actions secret.

## Data Flow

### Static Generation

Astro generates static HTML at build time. The site has no server-side rendering requirements.

### API Integration

The site talks to **two unrelated backends** — yeride-admin-api and
yeride-functions — across three flows. Don't conflate the first with the others:

```
Pre-registration   PreRegistrationForm → POST ${PUBLIC_API_URL}v1/auth/register
                   → yeride-admin-api. Writes a `whitelist` row; creates no account.

Fare estimates     FareEstimatePage → Google Maps (maps, places, marker, routes)
                   → Firebase callable `estimateFares` (us-east1) → yeride-functions

Fee schedule       FeeSchedule → GET ${PUBLIC_FEE_SCHEDULE_URL}
                   → yeride-functions. Plain fetch, no Firebase SDK.
```

Two contracts are written into `src/lib/` and should be read before changing
either page: `fareEstimate.ts` records why `ServiceEstimate` deliberately does
**not** declare `appCharges`/`appChargesTotal` (they are the *driver's* cost in
both payment flows, never the rider's), and `feeSchedule.ts` records that the
site is **never a third evaluator** of the backend's charge expressions.

See [API Integration](./api-integration.md) for details.

### Environment Variables

Public environment variables are prefixed with `PUBLIC_`. All six are required;
`npm run build` fails on a missing or empty one.

The list is [`.env.example`](../.env.example), which is committed — copy it to `.env`
and fill in the values. Its names are asserted against `scripts/env-required.mjs` on
every pull request, and so is the "Create env file" step in `deploy-all.yml`, so all
three places a required name must appear cannot drift. What each variable is for, and what
specifically breaks without it, is in CLAUDE.md and in the `breaks` strings in
`scripts/env-required.mjs`.

## Build Process

There is no test runner and no linter. **`npm run build` is the verification
gate**, and it runs eight things in order — any one of them fails the build:

1. **Route parity** (`check-route-parity.mjs`) — every route has its `/es/` twin.
2. **Copy gate** (`check-copy-gate.mjs`) — gated and never-claimed strings
   (copy-map §5) must not reach `src/` or `public/`.
3. **Env example parity** (`check-env-example.mjs`) — `.env.example` and
   `scripts/env-required.mjs` must name the same six variables. It reads names
   only, never a value, so it needs neither dependencies nor secrets.
4. **Deploy env parity** (`check-deploy-env.mjs`) — the "Create env file" step in
   `deploy-all.yml` writes exactly those names, each from its own same-named
   secret, truncating once (`>`) and appending after (`>>`). That step is the
   only thing that puts a value into the deploy's `.env`, and missing a line
   there fails the deploy on `main` naming a *secret* that exists.
5. **Astro prose gate** (`check-astro-prose.mjs`) — a text node in an `.astro`
   template must not contain prose; body copy comes from `src/i18n/` (#88).
   Attributes and props are deliberately not covered — per-page `title` and
   `description` stay literal in the page files, which is #37's decision. Like
   1–4 it needs neither dependencies nor secrets.
6. **Env check** (`check-env.mjs`) — all six `PUBLIC_*` present, non-empty and
   printable ASCII. Astro inlines them at build time, so an empty one becomes a
   falsy literal and Rollup deletes the branch that tested it.
7. **`astro check`** — a type error fails the build.
8. **Dist copy gate** (`check-dist-copy-gate.mjs`) — §5 again, over `dist/`,
   after `astro build`. This is the layer that measures the actual promise.

Items 1–5 are dependency-free and run on every PR (`checks.yml`); 6–8 need
`npm ci` against the private registry and run on `main` (`deploy-all.yml`).

A ninth gate, **`check-fee-labels.mjs`**, runs *outside* the build because it
needs the network: it asks the live `getFeeSchedule` whether the site can name
every charge, service-area and ride-tier id it publishes. It fails on drift and
**skips** when it cannot ask. Deploy-time plus daily on a schedule.

Full detail for each is in CLAUDE.md.

## Configuration Files

### astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  // must match public/CNAME — canonical and hreflang URLs derive from it
  site: 'https://www.yeride.com',
  // routes the MOBILE APP promises; see Routing above before touching these
  redirects: {
    '/privacy': '/privacy-policy',
    '/es/privacy': '/es/privacy-policy',
    '/support': '/contact',
    '/es/support': '/es/contact',
  },
});
```

### tsconfig.json

Extends Astro's strict TypeScript configuration for type safety.

## Design Decisions

### Why Astro?

- **Performance** - Zero JavaScript by default
- **Simplicity** - File-based routing, component-based architecture
- **Flexibility** - Can integrate React/Vue components if needed
- **SEO** - Static HTML for search engine optimization

### Why Tailwind CSS?

- **Rapid Development** - Utility classes speed up styling
- **Consistency** - Design system built into the framework
- **Performance** - Unused styles purged in production

### Why Static Generation?

- **Speed** - Pre-rendered HTML loads instantly
- **Reliability** - No server dependencies
- **Cost** - Free hosting on GitHub Pages
- **Security** - No server-side vulnerabilities
