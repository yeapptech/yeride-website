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
| `npm run build` | Build production site |
| `npm run preview` | Preview production build |
| `npm run astro check` | Run TypeScript checks |

## Project Structure

```
yeride-website/
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layout templates
│   ├── pages/          # Route pages
│   ├── data/           # Static data
│   └── styles/         # Global styles
├── public/             # Static assets
├── docs/               # Documentation
└── dist/               # Build output
```

## Documentation

- [Getting Started](docs/getting-started.md) - Setup and installation
- [Architecture](docs/architecture.md) - Project structure and design
- [Components](docs/components.md) - Component reference
- [API Integration](docs/api-integration.md) - Backend integration
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

- [yeride-admin-api](https://github.com/yeapptech/yeride-admin-api) - Backend API

## License

Copyright (c) YeApp Tech. All rights reserved.
