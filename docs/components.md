# Components

This document describes the reusable components in the YeRide website.

## Layout Components

### BaseLayout

The base layout template for all pages.

**Location:** `src/layouts/BaseLayout.astro`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | No | Page title |

**Usage:**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="About Us">
  <main>
    <h1>About YeRide</h1>
    <p>Your content here</p>
  </main>
</BaseLayout>
```

## Navigation Components

### Header

The main navigation header with mobile-responsive menu.

**Location:** `src/components/Header.astro`

**Features:**
- Logo and brand name
- Desktop navigation links
- Mobile hamburger menu toggle
- Smooth scroll to sections
- Responsive design

**Navigation Items:**
- Home
- About
- Contact
- Pre-Register (CTA button)

**Usage:**

```astro
---
import Header from '../components/Header.astro';
---

<Header />
```

### Footer

The site footer with links and social media.

**Location:** `src/components/Footer.astro`

**Features:**
- Brand information
- Quick links section
- Social media links (Twitter, Instagram, Facebook)
- Copyright notice

**Usage:**

```astro
---
import Footer from '../components/Footer.astro';
---

<Footer />
```

### navBar

A simple navigation bar component.

**Location:** `src/components/navBar.astro`

**Usage:**

```astro
---
import NavBar from '../components/navBar.astro';
---

<NavBar />
```

## Form Components

### PreRegistrationForm

The pre-registration form, embedded on `/drivers` and `/riders` and their `/es/` twins
(wayfinder #37). Copy is `docs/copy-map.md` §2.2.

**Props**

| Prop | Type | Required | Notes |
|---|---|---|---|
| `lang` | `"en" \| "es"` | yes | Selects the copy set from `src/i18n/formCopy.ts` |
| `role` | `"driver" \| "rider"` | yes | Pre-set by the page — there is no role dropdown |
| `heading` | `string` | yes | Form heading, per page (§3.2, §3.3) |
| `sub` | `string` | yes | Line beneath the heading |

**Form fields**

| Field | Type | Validation |
|---|---|---|
| First name | text | Required |
| Last name | text | Required |
| Email | email | Required, `local@domain.tld` shape |
| Phone | tel | Required, E.164 after formatting characters are stripped: `+`, a country code not starting with 0, 10–15 digits total |
| `role` | hidden | Set by the `role` prop |

**There are no password fields.** The endpoint accepts five fields and `password` is not
one of them, so collecting a password would send it over the wire to be discarded. See the
comment block in `src/i18n/formCopy.ts` and the amendment to copy-map §2.2.

**API submission**

POSTs to `${PUBLIC_API_URL}v1/auth/register` (yeride-admin-api), which writes a `whitelist`
row — it does not create an account:

```json
{
  "data": {
    "firstName": "Ana",
    "lastName": "Perez",
    "email": "ana@example.com",
    "phoneNumber": "+13055550100",
    "role": "driver"
  }
}
```

The phone goes over the wire as E.164 because the endpoint dedupes on an exact string
match. Outcomes are keyed off the response `code`, not the status: it returns 409 for a
duplicate email *and* a duplicate phone, so the status alone cannot tell them apart. The
raw API error string is logged, never displayed.

**Usage**

```astro
<PreRegistrationForm lang="en" role="driver" heading="Pre-register as a driver" sub="Takes a minute." />
<AvailabilityBlock lang="en" />
```

`AvailabilityBlock` belongs directly beneath it (§2.1) — the form's success state replaces
the fields with the success line and leaves that block on screen.

## Page Components

Each renders one route's whole body and takes `lang` alone, resolving its copy from
`src/i18n/`. The route files under `src/pages/` stay thin: `BaseLayout` plus the component.

### HomePage

`/` and `/es/` (wayfinder #37) — the Variant D "Hail" language (#33) with copy-map §3.1's
restructure: the audience fork sits in the Cab Yellow hero, the Ink band is buttonless with
each half linking as a whole block, and the paper strip carries the facts and the `/fees`
link. Carries no pre-registration form.

### DriversPage

`/drivers` and `/es/drivers` — copy-map §3.2. Pillars are the spine. The **gated driver
pillar-2 slot** sits between pillar 1 and pillar 3, marked by a plain comment naming #43 and
holding nothing else; do not put a string there, commented out or otherwise, until the gate
lifts.

### RidersPage

`/riders` and `/es/riders` — copy-map §3.3. Reserves nothing: rider pillar 2 is ungated and
runs. "Card or cash." renders as a support line, never a section headline.

### AvailabilityBlock

What exists today (copy-map §2.1): live on Android with the Play badge, iOS labelled as a
TestFlight beta. **There is no App Store badge** and must not be one until a public App
Store listing exists.

**Props**

| Prop | Type | Required | Notes |
|---|---|---|---|
| `lang` | `"en" \| "es"` | yes | Selects the copy set from `src/i18n/formCopy.ts` |

## Fee Components

### FeeSchedule

The whole body of `/fees` and `/es/fees` (wayfinder #40), on the locked "Posted Card"
layout (#36).

**Props**

| Prop | Type | Required | Notes |
|---|---|---|---|
| `lang` | `"en" \| "es"` | yes | Selects the copy set from `src/i18n/feesCopy.ts` |

**Usage**

```astro
<BaseLayout title="The fee schedule | YeRide" lang="en" headerGround="ink">
  <FeeSchedule lang="en" />
</BaseLayout>
```

**Why it carries a client script.** Every amount is fetched at runtime from
`getFeeSchedule` — no fee figure may be hard-coded (copy map §0.4) — so the rate card,
the charge panels and the example are built by the script from the response. Only the
headings, leads, the Stripe section and surge are static, because those are claims that
hold in every fetch state. The endpoint URL comes from `PUBLIC_FEE_SCHEDULE_URL`.

**Three refusals it enforces.** These are the reason the component is shaped this way,
and none of them should be relaxed without reading #47:

1. A missing rate, or a rule the endpoint can't summarise, renders as an explicit gap
   (`—`) — **never `$0.00`**, which would publish a wrong price as if it were real.
2. A charge id `src/i18n/feeLabels.ts` doesn't cover is **never guessed into a fee
   family**; it renders in a neutral panel, keeps the backend `description` verbatim in
   both languages, and carries no family's notes.
3. The example ledger claims the money reconciles across both columns, so it is
   **withheld entirely** — never shown short — if any charge is unclassified *or* is
   missing an amount in `example.appCharges`.

The ledger splits by `payer`, never by family: YeRide's charges come out of the
driver's side in both payment flows.

**Related:** `src/lib/feeSchedule.ts` (endpoint contract, fetch, formatting),
`src/i18n/feeLabels.ts` (charge labels + family/payer), `src/i18n/feesCopy.ts` (page
copy, EN/ES).

## Page-Specific Components

### Homepage (index.astro)

Nothing page-specific any more: `index.astro` is a thin `BaseLayout` + `HomePage` wrapper
(wayfinder #37), like every other redesigned route. The gradient hero, feature cards,
two-column rider/driver comparison, embedded form and App Store badge documented here
before are all gone.

### Contact Page (contact.astro)

**Contact Cards**
- Email contact information
- Location information
- Response time expectations

**Tally Form Embed**
- Embedded iframe from Tally.so
- Contact form functionality

## Component Patterns

### Responsive Design

All components use Tailwind's responsive prefixes:

```html
<!-- Mobile-first approach -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 1 column on mobile, 2 on tablet, 3 on desktop -->
</div>
```

### Interactive Elements

JavaScript is used sparingly for:
- Mobile menu toggle
- Form validation and submission
- Smooth scrolling

Example pattern:

```html
<script>
  const button = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');

  button?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
  });
</script>
```

### Color Scheme

The primary color palette:
- **Primary Green:** `#22c55e` (green-500)
- **Dark Green:** `#16a34a` (green-600)
- **Background:** `#f9fafb` (gray-50)
- **Text:** `#111827` (gray-900)

## Adding New Components

1. Create a new `.astro` file in `src/components/`
2. Define props interface if needed
3. Write component markup with Tailwind classes
4. Import and use in pages

Example:

```astro
---
// src/components/Button.astro
interface Props {
  variant?: 'primary' | 'secondary';
  href?: string;
}

const { variant = 'primary', href } = Astro.props;
const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-colors';
const variantClasses = {
  primary: 'bg-green-600 text-white hover:bg-green-700',
  secondary: 'bg-white text-green-600 border-2 border-green-600 hover:bg-green-50',
};
---

{href ? (
  <a href={href} class={`${baseClasses} ${variantClasses[variant]}`}>
    <slot />
  </a>
) : (
  <button class={`${baseClasses} ${variantClasses[variant]}`}>
    <slot />
  </button>
)}
```
