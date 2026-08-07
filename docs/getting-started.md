# Getting Started

This guide will help you set up the YeRide website for local development.

## Prerequisites

- **Node.js** 20.x or later
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
   secrets, and the placeholders are deliberately invalid so a forgotten one fails
   loudly. Ask for the real ones, or read them from the repository secrets.

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
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro check` | Run TypeScript type checking |

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

```
yeride-website/
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layout templates
│   ├── pages/          # Route pages (file-based routing)
│   ├── data/           # Static data files
│   └── styles/         # Global styles
├── public/             # Static assets (images, favicon, etc.)
├── docs/               # Project documentation
└── dist/               # Build output (generated)
```

## Common Issues

### Port Already in Use

If port 4321 is in use, you can specify a different port:

```bash
npm run dev -- --port 3000
```

### TypeScript Errors

Run the type checker to identify issues:

```bash
npm run astro check
```

### Environment Variables Not Loading

- Ensure your `.env` file is in the root directory
- Restart the development server after changing environment variables
- Variables must be prefixed with `PUBLIC_` to be accessible in the browser

## Next Steps

- Read the [Architecture Guide](./architecture.md) to understand the project structure
- Check out the [Components Documentation](./components.md) for available UI components
- Review the [Deployment Guide](./deployment.md) for production deployment
