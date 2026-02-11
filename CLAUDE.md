# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YeRide website — a static marketing and pre-registration site for a community-driven ridesharing platform. Built with Astro, deployed to GitHub Pages at https://www.yeride.com.

## Commands

```bash
npm run dev        # Dev server at http://localhost:4321
npm run build      # Type-check (astro check) + production build → dist/
npm run preview    # Preview production build locally
```

There is no test runner configured. No linter configured.

## Environment Variables

Create a `.env` file for local development:
```
PUBLIC_API_URL=https://api.yeride.com/
```

The `PUBLIC_` prefix makes it available client-side. Used by the PreRegistrationForm component to POST to `${PUBLIC_API_URL}v1/auth/register`.

## Architecture

**Framework:** Astro 5 (static output, zero JS by default)
**Styling:** Tailwind CSS 3 via `@astrojs/tailwind` integration + Open Props for CSS custom properties
**Deployment:** GitHub Actions → GitHub Pages (triggered on push to `main`)

### Key directories

- `src/pages/` — File-based routing. Each `.astro` file = a route
- `src/components/` — Reusable Astro components (Header, Footer, PreRegistrationForm, navBar)
- `src/layouts/` — BaseLayout.astro (used by secondary pages, **not** used by index.astro)
- `src/styles/main.css` — Global styles (Open Props imports)
- `public/` — Static assets served as-is (images, favicon, CNAME)
- `docs/` — Project documentation (architecture, components, API, deployment, contributing)

### Layout inconsistency to be aware of

The homepage (`index.astro`) is self-contained with its own inline header/footer and loads Tailwind via CDN. Other pages use `BaseLayout.astro` with the `Header` and `Footer` components and get Tailwind from the Astro integration. This means changes to shared navigation need to be applied in multiple places.

### Third-party integrations

- **Firebase SDK** (`firebase` package) — client-side, used for pre-registration
- **Tally.so** — embedded contact form on `/contact` (form ID: `mJa5J7`)
- **Google Fonts** — Inter (400, 600, 700)

## Coding Conventions

- Astro components use `.astro` extension with scoped `<style>` tags
- Use Tailwind utility classes directly; **never use `@apply`**
- Minimize client-side JavaScript; use `client:*` directives only when hydration is needed
- TypeScript for type safety (extends `astro/tsconfigs/base`)
- Conventional Commits for commit messages (feat, fix, docs, chore, etc.)
- Mobile-first responsive design using Tailwind breakpoints (sm, md, lg)

## Deployment

Pushes to `main` trigger `.github/workflows/deploy-all.yml`:
1. Checkout → Node 20 setup → inject `PUBLIC_API_URL` from GitHub Secrets into `.env`
2. `npm ci` → `npm run build`
3. Upload `dist/` artifact → deploy to GitHub Pages
