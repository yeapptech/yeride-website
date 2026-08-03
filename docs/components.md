# Components

This document describes the reusable components in the YeRide website.

## Layout Components

### BaseLayout

The base layout template for all pages.

**Location:** `src/layouts/BaseLayout.astro`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | yes | `<title>`, per copy-map §4 |
| `description` | `string` | no | Meta description, per copy-map §4 |
| `lang` | `"en" \| "es"` | no (`"en"`) | Sets `<html lang>` and the chrome's language |
| `headerGround` | `"paper" \| "yellow" \| "ink"` | no (`"paper"`) | The ground the header sits on, so it merges with the page's first section |
| `alternates` | `boolean` | no (`true`) | EN/ES `hreflang` pair + `x-default`. Only `/404` and `/redirect` pass `false` — they are single-file by design (copy-map §3.10–§3.11) |

**Usage:**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import DriversPage from '../components/DriversPage.astro';
---

<BaseLayout
  title="Keep what you earn. | YeRide for drivers"
  description="No commission — YeRide's fees are flat, published, and never a percentage of the fare. Run YeRide alongside Uber and Lyft."
  lang="en"
  headerGround="yellow"
>
  <DriversPage lang="en" />
</BaseLayout>
```

## Navigation Components

### Header

Site header — copy per copy-map §1.1, styling per the approved "Hail" direction (#33).
Rendered by `BaseLayout`; pages do not import it directly.

**Location:** `src/components/Header.astro`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lang` | `"en" \| "es"` | no (`"en"`) | Selects the nav copy |
| `ground` | `"paper" \| "yellow" \| "ink"` | no (`"paper"`) | Picks the legal mark for that ground and inverts link tones on ink. The lockup embeds the primary mark, which `logo.md` forbids on Cab Yellow, so yellow takes the app-icon scheme and ink the reversed mark |
| `toggleHref` | `string` | **yes** | The same page in the other language |

**Navigation items** (order is fixed — audience pages, then the two proof pages, then the
toggle): Drivers / Maneja, Riders / Viaja, Fees / Tarifas, Fare estimate / Estimar tarifa,
then the ES⇄EN toggle. Below `sm` the links drop and **the mark and the toggle always
survive** — ES parity is not a progressive enhancement. There is no hamburger menu.

### Footer

Site footer — copy per copy-map §1.2. Rendered by `BaseLayout`.

**Location:** `src/components/Footer.astro`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lang` | `"en" \| "es"` | no (`"en"`) | Selects the link and line copy |

**Links:** About, Contact, Privacy Policy, Terms, plus the place, entity and copyright
lines. **Social is X/Twitter only** — the Facebook and Instagram icons pointed at `#` and
were removed for good. Do not re-add a social icon without a working URL.

### navBar

**Removed.** `src/components/navBar.astro` and `src/data/navData.ts` were deleted by the
brand foundation (wayfinder #35) — `navData` listed routes that never existed. `Header` is
the only navigation component.

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

### FareEstimatePage

The whole body of `/fare-estimate` and `/es/fare-estimate` (wayfinder #38), on the
"Hail" language: Cab Yellow ground for the ask and the form, paper for the map and the
numbers, an Ink close linking `/fees`. Replaced `FareEstimateForm` and
`FareResultsCard`, both deleted.

**Props**

| Prop | Type | Required | Notes |
|---|---|---|---|
| `lang` | `"en" \| "es"` | yes | Selects the copy set from `src/i18n/fareEstimateCopy.ts` |

**Usage**

```astro
<BaseLayout title="Estimate a fare | YeRide" lang="en" headerGround="yellow">
  <FareEstimatePage lang="en" />
</BaseLayout>
```

**Why it carries a client script.** The whole page is interactive: the Google Maps
loader supplies autocomplete, the map and Directions, and the fares come from the
Firebase callable `estimateFares` at submit time. `setOptions({ language })` is passed
the page's language, or the ES page gets English place names and an English "18 mins".

**Why it names a service area** (wayfinder #62). Every quote is for
`DEFAULT_SERVICE_AREA_ID`, whatever the rider typed, so the page states which area —
otherwise the map underneath implies the rider's own and a Chicago route reads as a
Chicago price. The line is rendered in the frontmatter, not from the response, because
it must stand in every state including a failed estimate. The constant lives in
`src/lib/serviceArea.ts` rather than `src/lib/fareEstimate.ts` so that reading it here
does not import `src/lib/firebase.ts`, which calls `initializeApp` at module scope.

### LegalDocument

The whole body of `/privacy-policy`, `/terms` and their ES twins (wayfinder #44). One
component for both documents, because they have the same shape: H1, a last-changed date,
a lead, numbered sections of paragraphs and bullet lists, and the governing-language note
copy-map §3.8/§3.9 fixes on both languages. No hero — these are the two pages nobody
arrives at to be sold something, so it is a reading column on paper.

**Props**

| Prop | Type | Required | Notes |
|---|---|---|---|
| `lang` | `"en" \| "es"` | yes | Selects the language from `src/i18n/legalCopy.ts` |
| `doc` | `"privacy" \| "terms"` | yes | Selects which of the two documents to render |

Both axes are needed, so this is the one page component that takes more than `lang` — it
still resolves its own copy from `src/i18n/`, which is the part of the contract that
matters. Passing the resolved document object instead would make the page files reach into
the copy module and leave the component unable to know its own language.

**Usage**

```astro
<BaseLayout title="Terms of Service | YeRide" lang="en">
  <LegalDocument lang="en" doc="terms" />
</BaseLayout>
```

**It linkifies two patterns and nothing else.** Email addresses and `www.yeride.com/...`
URLs in the copy become links, because "write to support@yeride.com" is the only action
either document asks for and plain text would make it unclickable. Everything else stays
plain, so the copy in `src/i18n/legalCopy.ts` remains strings rather than markup.

**The four `copy-gate-allow` pragmas.** `legalCopy.ts` states that YeRide provides no
insurance. Copy-map §5 gates that word on #48 and the gate is a line matcher, so it cannot
tell that denial from a claim — hence the pragmas, which print on every build. When #48
lands the statements become *false* and must be rewritten, not merely un-pragma'd.

Those pragmas are stripped by the build, so the same sentences are blessed a **second** time
in `scripts/check-dist-copy-gate.mjs`'s `ALLOWED` list, keyed to the built pages (#57).
Five entries cover the four pragmas, because §5's `/\b(seguros?|aseguranza|p[óo]liza)\b/`
matches **twice** in *"el número de póliza de seguro del vehículo"* — two words, one
sentence. Note that only two of the four are denials; the other two name the vehicle
insurance policy number as a field the app collects.

Both lists are self-cleaning, so editing a legal sentence that contains *insurance*,
*seguro* or *póliza* — even to add a second one — fails the build until both are updated.
That cost is the point: adding one is a decision.

**Four refusals it enforces.** Read #38 before relaxing any of them:

1. **It shows the fare and nothing else about money.** `estimateFares` also returns
   `appCharges`/`appChargesTotal`, and `ServiceEstimate` deliberately does not declare
   them, so no page can render them by accident. They are the *driver's* cost in both
   payment flows — itemising them beside a rider's fare would claim the rider pays
   money they do not (copy map §3.5, amended under #47).
2. **A fare that is not a positive finite number renders as a gap (`—`) — never
   `$0.00`.** This is reachable: `calculateFare` coalesces all four rates to `0`, so a
   `rideServices` document with holes quotes zero, and a published zero says the ride is
   free. Same rule as `FeeSchedule`, same reason.
3. **A quote belongs to the route it was asked for.** A counter retires every in-flight
   quote when either end changes or the form is submitted again, so a reply about an
   abandoned journey can never be rendered under a map showing a different one.
4. **§3.5's "Outside area" line is not shipped.** The page asks for
   `us-fl-south-florida` on every call and cannot know where the rider is, so it has no
   condition that makes the sentence true — see #62.

**Related:** `src/lib/fareEstimate.ts` (callable contract), `src/lib/firebase.ts`
(callable region), `src/i18n/fareEstimateCopy.ts` (page copy, EN/ES).

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

Four brand colours, and only these. They come from the `@yeapptech/yeride-brand` Tailwind
preset — **never restate the hex values** (CONSUMING.md; wayfinder #35):

| Token | Class | Notes |
|---|---|---|
| Cab Yellow | `cab-yellow` | Hero grounds. Legal as **text** only on dark grounds (#33) |
| Ink | `ink` | Body text on paper; the dark band's ground |
| Paper | `paper` | Page ground; text on ink |
| Pullman Brown | `pullman-brown` | Hover state for ink buttons; validation errors |

The green/grey palette documented here before was pre-brand and no longer exists in the
build.

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
  primary: 'bg-ink text-paper hover:bg-pullman-brown',
  secondary: 'border-2 border-ink text-ink hover:bg-ink hover:text-paper',
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
