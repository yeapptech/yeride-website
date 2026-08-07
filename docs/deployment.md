# Deployment

This document describes how to deploy the YeRide website.

## Overview

The YeRide website is deployed to **GitHub Pages** via GitHub Actions. The deployment is automated on pushes to the `main` branch.

## Deployment Architecture

```
GitHub Repository (main branch)
        ↓
GitHub Actions Workflow
        ↓
Build Astro Site
        ↓
GitHub Pages
        ↓
www.yeride.com
```

## Prerequisites

### Repository Settings

1. **GitHub Pages enabled**
   - Go to **Settings** → **Pages**
   - Source: **GitHub Actions**

2. **Required Secrets**
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add the following secret:

   The six secret names are exactly the six variable names in `.env.example`;
   `npm run checks` fails on a pull request where that file and
   `scripts/env-required.mjs` disagree.

   All six are required, not just `PUBLIC_API_URL` — the build fails on a missing
   or empty one (`scripts/check-env.mjs`), and `deploy-all.yml`'s "Create env
   file" step must write each one. A secret that has been renamed or never
   created interpolates to the empty string, which is the case that check exists
   to catch.

### Custom Domain

The site uses a custom domain configured via:
- `public/CNAME` file containing `www.yeride.com`
- DNS records pointing to GitHub Pages

## GitHub Actions Workflow

**File:** `.github/workflows/deploy-all.yml`

### Workflow Triggers

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # Manual trigger
```

### Workflow Steps

1. **Checkout** - Clone repository code
2. **Setup Node.js** - Install Node.js 20 with npm caching
3. **Create .env** - Inject secrets as environment variables
4. **Install dependencies** - Run `npm ci`
5. **Build** - Run `npm run build` (includes TypeScript checking)
6. **Upload artifact** - Prepare build output for deployment
7. **Deploy** - Publish to GitHub Pages

### Full Workflow

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Create .env file
        # All six PUBLIC_* secrets, one line each — the build fails on a missing
        # or empty one. See deploy-all.yml for the authoritative version.
        run: echo "PUBLIC_API_URL=${{ secrets.PUBLIC_API_URL }}" > .env

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Manual Deployment

### Build Locally

```bash
# Install dependencies
npm ci

# Create environment file — all six PUBLIC_* variables
cp .env.example .env

# Now fill in the five secret values. Not optional here: the placeholders are
# non-empty and well-formed, so check-env.mjs passes them — it checks that a
# value exists, never that it works — and the build goes green against five
# fake keys, serving a site whose map, fare estimate and rate card are dead.

# Build the site
npm run build

# Preview locally
npm run preview
```

### Deploy to GitHub Pages

1. Push changes to `main` branch:
   ```bash
   git add .
   git commit -m "Update site"
   git push origin main
   ```

2. Monitor deployment:
   - Go to **Actions** tab in GitHub
   - Watch the workflow progress
   - Check for any errors

### Trigger Manual Deployment

1. Go to **Actions** tab
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

## Troubleshooting

### Build Failures

**TypeScript Errors**
```bash
npm run astro check
```
Fix any reported type errors before pushing.

**Missing Dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Environment Variable Issues**
- Verify all six `PUBLIC_*` secrets are set in repository settings — the build
  fails naming the ones it could not find (`scripts/check-env.mjs`)
- Check that the URL ends with a trailing slash

### Deployment Failures

**Pages Not Updating**
- Check Actions tab for workflow status
- Verify the workflow completed successfully
- Clear browser cache or try incognito mode

**404 Errors**
- Verify `public/.nojekyll` file exists
- Check that routes match page file names
- Ensure `astro.config.mjs` has correct `site` URL

**Custom Domain Issues**
- Verify `public/CNAME` contains correct domain
- Check DNS configuration with your domain registrar
- Wait for DNS propagation (up to 48 hours)

### Viewing Logs

1. Go to **Actions** tab
2. Click on the failed workflow run
3. Expand the failed step to view logs

## Rollback

To rollback to a previous version:

1. Go to **Actions** tab
2. Find a successful previous deployment
3. Click **Re-run all jobs**

Or revert the commit:

```bash
git revert HEAD
git push origin main
```

## Environment-Specific Configuration

### Production
- URL: `https://www.yeride.com`
- API: Production API endpoint

### Staging (if applicable)
- Create a separate branch (e.g., `staging`)
- Configure separate GitHub Pages deployment
- Use staging API endpoint

## Security Checklist

- [ ] All six `PUBLIC_*` secrets are set (see CLAUDE.md; a missing one fails the build)
- [ ] No sensitive data in committed files
- [ ] HTTPS enforced on custom domain
- [ ] `.env` file in `.gitignore`

## Related Documentation

- [Getting Started](./getting-started.md) - Local development setup
- [API Integration](./api-integration.md) - Backend configuration
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/github/)
