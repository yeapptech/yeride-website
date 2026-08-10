# Getting Started

This guide will help you set up the YeRide website for local development.

## Prerequisites

- **Node.js** 22.6 or later — **not** 20.x. `npm run test:gates` runs
  `scripts/service-area.test.mjs` with `--experimental-strip-types` so it can import
  the real `src/lib/serviceArea.ts` rather than keep a second copy of the maths, and
  that flag does not exist before 22.6. On an older Node that control — the last of
  the seven, so you get six green ticks first — dies on the flag itself:
  `node: bad option: --experimental-strip-types`. CI runs **24**, where type
  stripping is the default and the flag is accepted anyway.
- **npm** 9.x or later
- A code editor (VS Code recommended)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yeapptech/yeride-website.git
   cd yeride-website
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the committed example and fill in the values:

   ```bash
   cp .env.example .env
   ```

   `.env.example` is the list — all six variables, each with a comment saying what
   it is for. Only `PUBLIC_API_URL` carries a real value there; the other five are
   secrets. Ask for the real ones, or read them from the repository secrets.

   Fill them in before judging anything on a page. The placeholders are invalid but
   well-formed, and `scripts/check-env.mjs` checks that a value exists, never that
   it works — so the build stays **green** with them in place and the failures show
   up in the browser: no map on `/fare-estimate`, no fare, and `/fees` in its error
   state.

   > **Note:** The `PUBLIC_API_URL` must end with a trailing slash. This variable is used by the pre-registration form to submit user data.

   > All six `PUBLIC_*` variables are required: `npm run build` fails on a missing or
   > empty one (`scripts/check-env.mjs`), because the build inlines these and a page
   > whose variable went missing ships broken rather than failing. `npm run dev`,
   > `npm run checks` and `npx astro check` need none of them.

## Development

Start the local development server:

```bash
npm run dev
```

The site will be available at [http://localhost:4321](http://localhost:4321).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run checks` | The gates a pull request must pass — needs neither dependencies nor secrets |
| `npm run test:gates` | The control sets alone (also run first by `npm run checks`) |
| `npm run build` | `npm run checks`, then the env check, `astro check`, `astro build` and the dist copy gate |
| `npm run preview` | Preview production build locally |
| `npx astro check` | Type-check alone |
| `npm run check:env` | The env gate alone (needs a filled-in `.env`) |
| `npm run check:dist` | The dist copy gate alone (needs a `dist/`) |
| `npm run check:fee-labels` | Every published charge/area/tier id has an EN/ES label (needs the network) |

`npm run build` is a chain of gates, not just a compile: what each one asserts, and
why it exists, is in [CLAUDE.md](../CLAUDE.md). Run `npm run checks` before opening a
pull request — it is exactly what CI runs on one.

## Building for Production

Build the static site:

```bash
npm run build
```

The output will be in the `./dist/` directory, ready to be deployed to any static hosting service.

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

The tree, annotated, is one place: **[Directory Structure](./architecture.md#directory-structure)**.
It is not repeated here — a second copy is a second thing to keep true, and nothing
asserts either.

Two things it will tell you that surprise people: there is no `src/data/` or
`src/styles/` (deleted by the brand foundation, wayfinder #35, along with the CDN
Tailwind tags, the Google Fonts link to Inter and the Open Props import — **do not
re-add any of them**), and all copy lives in `src/i18n/`, never in a template.

## Common Issues

### Port Already in Use

If port 4321 is in use, you can specify a different port:

```bash
npm run dev -- --port 3000
```

### TypeScript Errors

Run the type checker to identify issues:

```bash
npx astro check
```

### Environment Variables Not Loading

- Ensure your `.env` file is in the root directory
- Restart the development server after changing environment variables
- Variables must be prefixed with `PUBLIC_` to be accessible in the browser

## Next Steps

- Read the [Architecture Guide](./architecture.md) to understand the project structure
- Check out the [Components Documentation](./components.md) for available UI components
- Review the [Deployment Guide](./deployment.md) for production deployment
