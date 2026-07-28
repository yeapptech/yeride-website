---
name: new-page
description: Use when adding a route to the YeRide site, or when a page renders unstyled, flashes unstyled content on load, or is missing the site header and footer.
---

# new-page

## Overview

The five existing pages disagree structurally, so copying whichever one you
happened to open propagates whichever legacy shape it carries. Copy this instead.

`fare-estimate.astro` is the only page in the post-migration shape (commit
`0fdd9bf`, "replace Tailwind CDN with Astro integration"). It is the model.

## Template

```astro
---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width" />
    <meta name="generator" content={Astro.generator} />
    <title>Page Name - YeRide</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-gray-50 text-gray-900 font-sans">
    <Header />
    <main class="pt-[90px]">
      <!-- content -->
    </main>
    <Footer />
  </body>
</html>
```

## Rules

- **No `<script src="https://cdn.tailwindcss.com">`.** `index.astro`,
  `about.astro`, `contact.astro`, and `privacy-policy.astro` still load it on top
  of the `@astrojs/tailwind` build. That is duplicate CSS and a flash of
  unstyled content, not a requirement.
- **Do not use `BaseLayout.astro`.** Only `404.astro` does. It pulls Open Props
  from unpkg at runtime and renders a nav pointing at routes that don't exist.
- **Keep `pt-[90px]` on `<main>`.** The header is fixed; without it the first
  section renders underneath.
- **Client-side JS goes in a bundled `<script>`** (plain `<script>` in the page,
  as `fare-estimate.astro` does) so imports resolve. `is:inline` scripts cannot
  use imports and need `define:vars` to receive any value.

## After creating the page

Add it to the site navigation — that is four separate edits, not one. Use the
`nav-sync` skill.
