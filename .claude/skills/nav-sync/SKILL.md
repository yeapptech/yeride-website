---
name: nav-sync
description: Use when adding, removing, renaming, or re-pointing any navigation or footer link on the YeRide site, or when a link appears on some pages but not the homepage.
---

# nav-sync

Navigation markup is duplicated across four independent copies. A link must be
added to all four, or it appears on some pages and not others.

| Surface | File | Reaches |
|---|---|---|
| Shared header | `src/components/Header.astro` | about, contact, privacy-policy, fare-estimate |
| Shared footer | `src/components/Footer.astro` | same four pages |
| Inline header | `src/pages/index.astro` (~95–130) | homepage only |
| Inline footer | `src/pages/index.astro` (~345–395) | homepage only |

`src/components/navBar.astro` + `src/data/navData.ts` are a fifth, near-dead copy
reached only by `BaseLayout.astro` → `404.astro`. Its entries (`ride`, `drive`,
`register`) point at routes that do not exist.

`BaseLayout.astro` renders `<Nav />` + `<slot />` and **no footer at all**, so
`404.astro` has no footer to add a link to. Full-site footer coverage there is a
structural change (import and render `Footer.astro`), not a link edit — treat it
as out of scope unless asked.

Inventory every surface before and after the change — the two lists must match:

```bash
grep -n 'href=' src/components/Header.astro src/components/Footer.astro
grep -n 'href="/\|href="#' src/pages/index.astro
```
