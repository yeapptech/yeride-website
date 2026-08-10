# Contributing

This document describes how to contribute to the YeRide website.

## Development Workflow

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yeapptech/yeride-website.git
   cd yeride-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**

   All six `PUBLIC_*` variables are required, and `npm run build` fails if any of them
   is missing or empty (`scripts/check-env.mjs`). The list is `.env.example`.

   ```bash
   cp .env.example .env    # then fill in the five secret values
   ```

   Without the keys you can still run `npm run dev`, `npm run checks` and
   `npx astro check`; only `npm run build` needs all six.

4. **Start development server**
   ```bash
   npm run dev
   ```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines below
   - Test your changes locally

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Branch Naming

Use descriptive branch names with prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/add-testimonials` |
| `fix/` | Bug fixes | `fix/mobile-menu-toggle` |
| `docs/` | Documentation | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/simplify-header` |
| `style/` | Styling changes | `style/update-colors` |

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>: <description>

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
git commit -m "feat: add driver benefits section to homepage"

# Bug fix
git commit -m "fix: resolve mobile menu not closing on link click"

# Documentation
git commit -m "docs: add API integration guide"

# Refactoring
git commit -m "refactor: extract hero section into separate component"
```

## Code Style Guidelines

### Astro Components

```astro
---
// 1. Imports at the top
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';

// 2. Props interface (if applicable)
interface Props {
  title: string;
  description?: string;
}

// 3. Props destructuring
const { title, description = 'Default description' } = Astro.props;

// 4. Any logic/data fetching
const data = await fetchData();
---

<!-- 5. Template markup -->
<BaseLayout title={title}>
  <main>
    <h1>{title}</h1>
    <p>{description}</p>
  </main>
</BaseLayout>

<!-- 6. Scoped styles (if needed) -->
<style>
  /* Component-specific styles */
</style>

<!-- 7. Client-side scripts (if needed) -->
<script>
  // Interactive functionality
</script>
```

### TypeScript

- Use TypeScript for type safety
- Define interfaces for component props
- Avoid `any` type when possible

```typescript
// Good
interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

// Avoid
const items: any[] = [];
```

### Tailwind CSS

- Use utility classes for styling
- Follow mobile-first responsive design
- Group related classes logically

```html
<!-- Good: Organized by category -->
<div class="
  flex items-center justify-between
  p-4 mb-6
  bg-white rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">

<!-- Avoid: Random order -->
<div class="p-4 flex shadow-md bg-white hover:shadow-lg mb-6 items-center rounded-lg justify-between transition-shadow">
```

### File Organization

```
src/
├── components/       # One body component per route, plus Header/Footer/form
├── layouts/          # BaseLayout.astro — the only <html>/<head> in the repo
├── pages/            # Route pages; every one has an /es/ twin
├── i18n/             # EN/ES copy, per page
└── lib/              # Backend clients: fareEstimate, feeSchedule, serviceArea
```

Flat on purpose: there is no `ui/` or `features/` split, and no `data/`, `styles/` or
`utils/`. A route is one thin page file plus one component that holds the whole body,
with its copy in `src/i18n/` — see [Architecture](./architecture.md).

## Pull Request Process

### Before Submitting

- [ ] The gates pass (`npm run checks`) — this is exactly what CI runs on a pull request
- [ ] Code builds without errors (`npm run build`, which needs a filled-in `.env`)
- [ ] TypeScript checks pass (`npx astro check`)
- [ ] Any new or changed copy is in `src/i18n/` and written into `docs/copy-map.md`
- [ ] EN and ES ship together — no route, and no string, in one language only
- [ ] Changes tested locally
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventions

### PR Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
How were these changes tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Create PR with description and checklist
2. Request review from team members
3. Address review feedback
4. Merge after approval

## Adding New Pages

Use the `new-page` skill in `.claude/skills/` — it carries the current shape. The
rules it applies are gates, so getting them wrong is a red build rather than a review
comment:

1. Create the `.astro` file in `src/pages/` **and its `/es/` twin**. Every route ships
   EN and ES together; `scripts/check-route-parity.mjs` fails on a page with no twin.
2. Render through `BaseLayout`. No page declares its own `<html>`/`<head>`, and no page
   carries inline header or footer markup.
3. Keep the page file thin — `BaseLayout` plus one component holding the whole body.
4. **Put the copy in `src/i18n/`, not in the template.** A text node in an `.astro`
   template must not contain prose; `scripts/check-astro-prose.mjs` fails the build on
   one. Page `title` and `description` are the deliberate exception — they are passed
   as props from the page file.
5. Write the strings into [`docs/copy-map.md`](./copy-map.md) first. It is the copy
   source of truth, and its §5 is the gated list both copy gates enforce — a claim
   YeRide cannot make will fail the build in `src/` and again in `dist/`.
6. Link it in `Header.astro` or `Footer.astro` in **both** languages — see the
   `nav-sync` skill.

Read a shipped route end to end before writing a new one; `src/pages/about.astro` and
`src/pages/es/about.astro` are the smallest complete pair.

## Adding New Components

1. Create component in `src/components/`
2. Define props interface
3. Use Tailwind for styling
4. Document usage in `docs/components.md`

## Testing Changes

### Local Testing

```bash
# Development server with hot reload
npm run dev

# Production build test
npm run build
npm run preview
```

### What to Test

- [ ] Desktop layout (1200px+)
- [ ] Tablet layout (768px - 1199px)
- [ ] Mobile layout (< 768px)
- [ ] Navigation functionality
- [ ] Form submissions (if applicable)
- [ ] External links

## Getting Help

- Check existing documentation in `docs/`
- Review similar components for patterns
- Ask questions in pull request comments

## Related Documentation

- [Getting Started](./getting-started.md)
- [Architecture](./architecture.md)
- [Components](./components.md)
- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
