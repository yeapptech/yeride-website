# YeRide Website

The official marketing website for YeRide - a community-driven ridesharing platform.

[![Deploy to GitHub Pages](https://github.com/yeapptech/yeride-website/actions/workflows/deploy-all.yml/badge.svg)](https://github.com/yeapptech/yeride-website/actions/workflows/deploy-all.yml)

**Live Site:** [www.yeride.com](https://www.yeride.com)

## Tech Stack

- **[Astro](https://astro.build)** - Static site generator
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[TypeScript](https://www.typescriptlang.org)** - Type safety

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yeapptech/yeride-website.git
cd yeride-website

# Install dependencies
npm install

# Set up environment variables — .env.example lists all six
cp .env.example .env    # then fill in the five secret values

# Start development server
npm run dev
```

The site will be available at [http://localhost:4321](http://localhost:4321).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run checks` | The gates a pull request must pass — no dependencies, no secrets |
| `npm run test:gates` | The control sets alone (also run first by `npm run checks`) |
| `npm run build` | `npm run checks`, then the env check, `astro check`, `astro build` and the dist copy gate |
| `npm run preview` | Preview production build |
| `npx astro check` | Type-check alone |

`npm run build` is the only automated verification gate in this repo, and it is a
chain: what each link asserts, and why, is in [CLAUDE.md](CLAUDE.md). Run
`npm run checks` before opening a pull request — it is what CI runs.

## Project Structure

```
yeride-website/
├── src/
│   ├── components/     # One body component per route, plus Header/Footer/form
│   ├── layouts/        # BaseLayout.astro — the only <html>/<head> in the repo
│   ├── pages/          # Route pages; every one has an /es/ twin
│   ├── i18n/           # EN/ES copy, per page — no prose lives in a template
│   └── lib/            # Backend clients: fareEstimate, feeSchedule, serviceArea
├── scripts/            # The build gates and their controls
├── public/             # Static assets, shipped into dist/ byte for byte
├── docs/               # Documentation
└── dist/               # Build output
```

There is no `src/data/` or `src/styles/`: `navData.ts` and `main.css` were deleted
by the brand foundation (wayfinder #35) and must not come back.

## Documentation

- [Getting Started](docs/getting-started.md) - Setup and installation
- [Architecture](docs/architecture.md) - Project structure and design
- [Components](docs/components.md) - Component reference
- [Copy map](docs/copy-map.md) - **Every string on the site, EN and ES.** The source
  of truth for copy: §5 is the gated list both copy gates enforce
- [API Integration](docs/api-integration.md) - The two backends
- [Deployment](docs/deployment.md) - CI/CD and hosting
- [Contributing](docs/contributing.md) - Development workflow

## Environment Variables

The list lives in [`.env.example`](.env.example) — copy it to `.env` and fill in the
values. All six `PUBLIC_*` variables are required: `npm run build` fails on a missing
or empty one. `npm run dev` needs none of them.

What each variable is for, and what specifically breaks without it, is in
[CLAUDE.md](CLAUDE.md) and in `scripts/env-required.mjs`.

## Deployment

The site deploys automatically to GitHub Pages when changes are pushed to `main`. See the [Deployment Guide](docs/deployment.md) for details.

## Related Repositories

- [yeride-admin-api](https://github.com/yeapptech/yeride-admin-api) - Pre-registration (`v1/auth/register`)
- [yeride-functions](https://github.com/yeapptech/yeride-functions) - `getFeeSchedule` (the `/fees` rate card) and the `estimateFares` callable
- [yeride-brand](https://github.com/yeapptech/yeride-brand) - Tokens, assets and the binding copy/design docs

## License

Copyright (c) YeApp Tech. All rights reserved.
