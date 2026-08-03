# Architecture

This document describes the technical architecture of the YeRide website.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| [Astro](https://astro.build) 5.x | Static site generator |
| [TypeScript](https://www.typescriptlang.org) 5.x | Type safety |
| [Tailwind CSS](https://tailwindcss.com) 3.x | Utility-first styling |
| [Firebase](https://firebase.google.com) 11.x | Backend services |

## Directory Structure

```
yeride-website/
├── src/
│   ├── components/           # Reusable Astro components
│   │   ├── Header.astro      # Navigation header with mobile menu
│   │   ├── Footer.astro      # Site footer
│   │   ├── navBar.astro      # Navigation bar
│   │   └── PreRegistrationForm.astro  # User registration form
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro  # Base page layout template
│   │
│   ├── pages/                # File-based routing
│   │   ├── index.astro       # Homepage
│   │   ├── about.astro       # About page
│   │   ├── contact.astro     # Contact page
│   │   ├── privacy-policy.astro  # Privacy policy
│   │   └── 404.astro         # Error page
│   │
│   ├── data/
│   │   └── navData.ts        # Navigation menu configuration
│   │
│   └── styles/
│       └── main.css          # Global styles
│
├── public/                   # Static assets
│   ├── favicon.svg           # Site favicon
│   ├── CNAME                 # Custom domain configuration
│   ├── .nojekyll             # Disable Jekyll on GitHub Pages
│   └── images/               # Image assets
│
├── .github/
│   └── workflows/
│       └── deploy-all.yml    # CI/CD workflow
│
└── Configuration files
    ├── astro.config.mjs      # Astro configuration
    ├── tailwind.config.mjs   # Tailwind configuration
    ├── tsconfig.json         # TypeScript configuration
    └── package.json          # Dependencies and scripts
```

## Routing

Astro uses **file-based routing**. Each `.astro` file in `src/pages/` becomes a route:

| File | Route |
|------|-------|
| `src/pages/index.astro` | `/` |
| `src/pages/about.astro` | `/about` |
| `src/pages/contact.astro` | `/contact` |
| `src/pages/privacy-policy.astro` | `/privacy-policy` |
| `src/pages/404.astro` | `/404` (error page) |

## Component Architecture

### Layout System

The `BaseLayout.astro` component provides the HTML structure shared across pages:

```astro
---
// BaseLayout.astro
const { title } = Astro.props;
---
<!DOCTYPE html>
<html>
  <head>
    <title>{title}</title>
  </head>
  <body>
    <Header />
    <slot />  <!-- Page content inserted here -->
    <Footer />
  </body>
</html>
```

### Component Types

1. **Layout Components** - Define page structure (`BaseLayout.astro`)
2. **UI Components** - Reusable interface elements (`Header`, `Footer`)
3. **Feature Components** - Complex functionality (`PreRegistrationForm`)
4. **Page Components** - Route-specific content (`index.astro`, `about.astro`)

## Styling Approach

### Tailwind CSS

The project uses Tailwind CSS for styling with utility classes:

```astro
<div class="flex items-center justify-between p-4 bg-white shadow-md">
  <h1 class="text-2xl font-bold text-gray-900">YeRide</h1>
</div>
```

### Global Styles

Global styles are defined in `src/styles/main.css`:

```css
@import "open-props/style";
/* Additional global styles */
```

### Configuration

Tailwind is configured in `tailwind.config.mjs`:

```javascript
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Data Flow

### Static Generation

Astro generates static HTML at build time. The site has no server-side rendering requirements.

### API Integration

The pre-registration form submits data to an external API:

```
User Input → PreRegistrationForm → POST /v1/auth/register → API Response
```

See [API Integration](./api-integration.md) for details.

### Environment Variables

Public environment variables are prefixed with `PUBLIC_`:

| Variable | Purpose |
|----------|---------|
| `PUBLIC_API_URL` | Base URL for API requests |

All six are required; `npm run build` fails on a missing one. The full list is in CLAUDE.md.

## Build Process

1. **Type Checking** - TypeScript validation via `astro check`
2. **Asset Processing** - Tailwind CSS compilation
3. **Static Generation** - HTML pages generated from Astro components
4. **Output** - Static files written to `./dist/`

## Configuration Files

### astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://yeride.com',
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
