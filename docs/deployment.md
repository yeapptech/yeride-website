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

   The six secret names are exactly the six variable names in `.env.example`,
   and exactly the six written by `deploy-all.yml`'s "Create env file" step.
   `npm run checks` fails on a pull request where any of those three and
   `scripts/env-required.mjs` disagree.

   All six are required, not just `PUBLIC_API_URL` — the build fails on a missing
   or empty one (`scripts/check-env.mjs`). A secret that has been renamed or
   never created interpolates to the empty string, which is the case that check
   exists to catch — and since the workflow line is now asserted on every pull
   request (`scripts/check-deploy-env.mjs`, #90), a failure there means the
   secret rather than the line.

### Custom Domain

The site uses a custom domain configured via:
- `public/CNAME` file containing `www.yeride.com`
- DNS records pointing to GitHub Pages

## GitHub Actions Workflow

**File:** `.github/workflows/deploy-all.yml`

### What it runs, and where that is written

`deploy-all.yml` is the authoritative description of the deploy, and this
document does not restate it. It used to. A "Full Workflow" listing lived here
until #71, and by then it had drifted from the real file in **every one of the
seven steps it showed** — all four action versions, the Node version, four
step names, the `NPM_TOKEN` the private registry needs — as well as in the
workflow's own name and its missing `concurrency:` block, and it omitted the
fee-label check entirely. The `.env` step was the one that bit: a single `echo`
with `>` under a comment saying there are six lines, so a reader who followed
the comment literally ended up with a `.env` holding only the last variable and
then hit the failure the comment was warning them about. Nothing asserted the
sample, which is why it drifted; the real step **is** asserted on every pull
request (`scripts/check-deploy-env.mjs`, #90) and is one click away, so the copy
bought nothing it did not also cost.

Read it there. What is worth writing down here is what the steps are *for*.

- **Create env file** — one `echo` per secret into `.env`, the first redirecting
  with `>` and the five after it appending with `>>`. Astro inlines these at
  build time, so this step is the only thing that puts a value into the deploy's
  environment. The step itself is checked on every pull request by
  `scripts/check-deploy-env.mjs` (#90): the six names must agree with
  `scripts/env-required.mjs`, each must come from its own same-named secret, and
  a second `>` — which would truncate the file back to one variable — fails.
  `.env.example` is held to that same one list by a separate gate,
  `scripts/check-env-example.mjs` (#70). Both run in `npm run checks`.
- **Fee-label coverage** — `scripts/check-fee-labels.mjs` (#56). It needs the
  network, so it cannot live inside `npm run build`. It fails the deploy on a
  charge, area or ride tier id the site cannot name, and skips loudly rather
  than passing quietly when the endpoint is unreachable.
- **Install dependencies** — `npm ci` with `NPM_TOKEN` in the environment. The
  committed `.npmrc` routes `@yeapptech/*` through GitHub Packages, so without
  that secret the install fails before anything is built.
- **Build Astro site** — `npm run build`, which is the whole gate chain
  (CLAUDE.md lists it). This is where a renamed or deleted secret becomes a red
  deploy rather than a live site with a dead pre-registration form.
- **Upload artifact**, then **Deploy to GitHub Pages** — publish `dist/`.

Triggers: a push to `main`, or a manual run from the **Actions** tab.

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
2. Select the **Deploy Website** workflow (`deploy-all.yml`)
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
