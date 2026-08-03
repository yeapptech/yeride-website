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
   is missing or empty (`scripts/check-env.mjs`). The full list is in CLAUDE.md.

   ```bash
   echo "PUBLIC_API_URL=https://api.yeride.com/" > .env
   # ...and the other five — see CLAUDE.md
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
├── components/        # Reusable components
│   ├── ui/           # Generic UI components
│   └── features/     # Feature-specific components
├── layouts/          # Page layouts
├── pages/            # Route pages
├── data/             # Static data/configuration
├── styles/           # Global styles
└── utils/            # Utility functions
```

## Pull Request Process

### Before Submitting

- [ ] Code builds without errors (`npm run build`)
- [ ] TypeScript checks pass (`npm run astro check`)
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

1. Create a new `.astro` file in `src/pages/`
2. Use `BaseLayout` for consistent structure
3. Add navigation link in `Header.astro`
4. Test the new route locally

Example:

```astro
---
// src/pages/faq.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="FAQ | YeRide">
  <main class="container mx-auto px-4 py-16">
    <h1 class="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
    <!-- FAQ content -->
  </main>
</BaseLayout>
```

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
