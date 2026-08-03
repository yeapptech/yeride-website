---
name: new-page
description: Use when adding a route to the YeRide site, or when a page renders unstyled, flashes unstyled content on load, or is missing the site header and footer.
---

# new-page

## Overview

There is one layout and one page shape. A route is **two files** — the English
page and its `/es/` twin — plus one component holding the body and one copy
module holding the strings. The build fails if you ship only one language.

This skill described the pre-redesign shape until wayfinder #38; #35 introduced
`BaseLayout`, #37 and #40 built the routes that now model the shape.

## The shape

A page file is thin: `BaseLayout` plus one body component. It carries no
`<html>`, no `<head>`, no header or footer markup, and no styling of its own.

`src/pages/example.astro`:

```astro
---
// /example (wayfinder #NN). Title and meta description per docs/copy-map.md §4.
import BaseLayout from "../layouts/BaseLayout.astro";
import ExamplePage from "../components/ExamplePage.astro";
---

<BaseLayout
  title="Example | YeRide"
  description="One sentence, from the copy map."
  lang="en"
  headerGround="paper"
>
  <ExamplePage lang="en" />
</BaseLayout>
```

`src/pages/es/example.astro` is the same file with `lang="es"`, the ES title and
description, `../../` import paths, and `<ExamplePage lang="es" />`. **Routes are
mirrored with English slugs** — `/example` → `/es/example`, never `/es/ejemplo`
(copy map §0.3).

`src/components/ExamplePage.astro` takes one prop, `lang: Lang`, and reads its
strings from `src/i18n/exampleCopy.ts` — an object keyed `en`/`es`. Copy is
**verbatim from `docs/copy-map.md`**; it is never authored in the component.
Model it on `RidersPage.astro` + `audienceCopy.ts`, or `FeeSchedule.astro` +
`feesCopy.ts` if the page fetches anything.

`BaseLayout` props: `title`, `description`, `lang`, `headerGround`
(`"paper" | "yellow" | "ink"` — the ground the header sits on, so it picks the
legible mark), and `alternates` (leave default; `false` only for `/404` and
`/redirect`, which are single-file by design).

## Rules

- **No bespoke `<head>`.** `BaseLayout` owns the title, description, canonical,
  `hreflang` alternates, favicons and fonts. Nothing else may declare `<html>`.
- **No CDN Tailwind, no Google Fonts link.** Tailwind comes from
  `@astrojs/tailwind` with the brand preset; Nunito is self-hosted via
  `@fontsource-variable/nunito`, imported once in `BaseLayout`, exposed as
  `font-brand`. Both CDN routes were removed in #35 — re-adding one is duplicate
  CSS and a flash of unstyled content.
- **Never use `@apply`.** Utility classes directly, mobile-first.
- **Ship EN and ES together.** `npm run build` runs `scripts/check-route-parity.mjs`
  first and fails on an English page with no `/es/` twin. If the twin genuinely
  cannot ship yet, add a `PENDING` entry naming the ticket that retires it — an
  entry whose twin later appears also fails, so it cannot go stale.
- **Watch the copy gate.** `scripts/check-copy-gate.mjs` fails the build on gated
  and never-claimed strings (copy map §5) anywhere in `src/` or `public/`. Read
  its pattern list before writing marketing copy.
- **Client-side JS goes in a bundled `<script>`** inside the body component, so
  imports resolve. `is:inline` cannot use imports and needs `define:vars`.
- **No hard-coded fee or fare amounts, ever** (copy map §0.4). Money is fetched.

## After creating the page

Add it to the site navigation — header and footer both live in
`src/components/`, with one caller each. Use the `nav-sync` skill.
