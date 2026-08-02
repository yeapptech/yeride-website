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

An interactive form for user pre-registration.

**Location:** `src/components/PreRegistrationForm.astro`

**Features:**
- First name and last name fields
- Email validation
- Phone number formatting (US +1 format)
- Role selection (Rider/Driver)
- Form validation
- Loading state indicator
- Success/error messages
- API submission

**Form Fields:**
| Field | Type | Validation |
|-------|------|------------|
| First Name | text | Required |
| Last Name | text | Required |
| Email | email | Required, valid email format |
| Phone Number | tel | Required, US format (+1 XXX XXX XXXX) |
| Role | select | Required (rider/driver) |

**API Submission:**

The form submits to `${PUBLIC_API_URL}v1/auth/register` with the following payload:

```json
{
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "role": "rider"
  }
}
```

**Usage:**

```astro
---
import PreRegistrationForm from '../components/PreRegistrationForm.astro';
---

<section id="pre-register">
  <PreRegistrationForm />
</section>
```

**Styling:**

The form uses Tailwind CSS classes for styling. Key classes:
- `bg-white rounded-lg shadow-lg` - Form container
- `focus:ring-2 focus:ring-green-500` - Input focus states
- `bg-green-600 hover:bg-green-700` - Submit button

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

The homepage contains several inline sections:

**Hero Section**
- Main headline and tagline
- Call-to-action buttons
- Background gradient

**Features Section**
- Icon-based feature cards
- Three-column grid layout

**For Riders / For Drivers**
- Two-column comparison layout
- Benefit lists for each user type

**Pre-Registration Section**
- Embedded PreRegistrationForm component
- Background styling

**App Download Section**
- App Store and Google Play badges
- Links to app stores

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
