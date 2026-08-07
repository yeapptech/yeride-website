---
name: nav-sync
description: Use when adding, removing, renaming, or re-pointing any navigation or footer link on the YeRide site, or when a link appears on some pages but not the homepage.
---

# nav-sync

Navigation is **not** duplicated. `Header.astro` and `Footer.astro` have exactly
one caller each — `BaseLayout.astro` — and every page renders through it
(wayfinder #35). A nav or footer change is one edit, in one file.

This skill described four duplicated copies until #39. The inline header and
footer in `index.astro`, `navBar.astro` and `src/data/navData.ts` were all
deleted by #35; none of them exist. If you are looking for a second copy to keep
in sync, there isn't one.

| Surface | File | Links today |
|---|---|---|
| Header | `src/components/Header.astro` | `/drivers`, `/riders`, `/fees`, `/fare-estimate`, then the EN⇄ES toggle |
| Footer | `src/components/Footer.astro` | `/about`, `/contact`, `/privacy-policy`, `/terms`, plus the X link |

Both are rendered by `BaseLayout` on every page, so both reach the whole site.

## Adding a link

Each file holds a `t` object keyed `en`/`es` for the labels and builds every
href as `` `${esPrefix}/route` ``, where `esPrefix` is `/es` when `lang === "es"`.
So a link is **one href plus two labels** — you never write the Spanish URL, and
an EN entry cannot ship without its ES twin.

Labels are copy. Take them from `docs/copy-map.md` §1.1 (header) and §1.2
(footer) rather than authoring them here.

Order is fixed in the header — audience pages, then the two proof pages, then
the toggle (§1.1). Don't reorder it to fit a new entry.

## What the build enforces

- **The route must exist in both languages.** `scripts/check-route-parity.mjs`
  fails on an English page with no `/es/` twin, so linking a route that only
  half-exists fails the build rather than 404ing in one language.
- **Labels go through the copy gate** like any other string
  (`scripts/check-copy-gate.mjs`, copy-map §5).

## Two things that are not files under `src/pages`

- **Redirect aliases** live in `astro.config.mjs` (`/privacy`, `/es/privacy`,
  `/support`). They are routes a visitor can reach and the mobile app depends on
  them (#44), but the parity check does not see them — it reads filenames. If you
  add an alias, add its `/es/` counterpart in the same edit.
- **`/404` and `/redirect`** are single files serving both languages
  (`bilingual` mode, #39). In `bilingual` mode `BaseLayout` renders *two* copies
  of the header and footer, one per language, and reveals one client-side — so
  these pages do have a footer, and your one edit reaches both copies.

## Check your work

Both hrefs and both label sets, before and after:

```bash
grep -n 'href=' src/components/Header.astro src/components/Footer.astro
grep -n 'about:\|contact:\|privacy:\|terms:\|drivers:\|riders:\|fees:\|estimate:' \
  src/components/Header.astro src/components/Footer.astro
npm run checks
```
