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
| `bilingual` | `boolean` | no (`false`) | Ships **both** languages of the header and footer and reveals one client-side. The same two pages that pass `alternates={false}` pass this, and no others (wayfinder #39) |

**`bilingual` mode.** GitHub Pages serves one root `404.html` for every missing path, so a
Spanish visitor at `/es/anything` lands on the English build of `/404`. Header and footer are
page copy like everything else, and leaving them English under Spanish content is the
half-translated page #62 and #65 were re-opened over — so in this mode `BaseLayout` renders
both and lets the page pick.

The mechanism is a stamp plus a stylesheet, not a DOM rewrite:

- an inline `<head>` script sets `data-lang="es"` on `<html>` when `location.pathname` is
  `/es` or starts with `/es/`, and fixes `<html lang>` to match. It runs **before the body is
  parsed**, so the right language is chosen before the first paint — a switch on
  `DOMContentLoaded` would flash English at every Spanish visitor.
- an inline `<style>` hides the halves: `html:not([data-lang="es"]) [data-lang="es"]` and
  `html[data-lang="es"] [data-lang="en"]`. Written as `:not`, so the **default state — no
  `data-lang`, which is what a visitor with JavaScript off gets — shows English and hides
  Spanish**, matching copy-map §3.10's "renders English by default".

Both must stay `is:inline`. A scoped `<style>` is keyed to this component's own elements and
cannot reach through `<slot>` into the page's halves; and Astro does **not** evaluate
expressions inside `<script>`/`<style>` bodies, so their content is written literally — a
`{\`…\`}` wrapper ships as text, which silently disables both and renders every page in both
languages at once, off a green build.

A page in this mode marks its own halves with `data-lang="en"` / `data-lang="es"` on a
wrapper. A display utility on that wrapper is safe: `html:not([data-lang="es"])
[data-lang="es"]` scores (0,2,1) against `.flex`'s (0,1,0) and the preset sets no
`important`, so the hiding rule wins — **measured**, after a first draft of this document
claimed the opposite.

The language toggle in this mode points at the **other language's home**, not at this path in
the other language: the path a visitor is on here either does not exist (`/404`) or is a
bounce stub (`/redirect`), so mirroring it would hand them a second dead end.

**What does not switch:** the `<title>`. Copy-map §4 authors one title for each of these two
routes, in English, and no meta description — switching it would mean inventing Spanish the
copy map has not authored.

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
then the ES⇄EN toggle. The links drop in two stages — Drivers, Riders and Fees are
`hidden sm:inline`, Fare estimate is `hidden md:inline`, so it is the first to go — and
**the mark and the toggle always survive** — ES parity is not a progressive enhancement.
There is no hamburger menu.

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

**The copyright line is the one piece of this component's copy that is not in its own
frontmatter.** `© {year} YeRide` was the last literal text node on the site, so #88's
prose gate moved it to `copyright` in `src/i18n/utilityCopy.ts`; the rest of the footer's
strings stay in `Footer.astro`'s `t` object, untouched. It takes no language — §1.2 gives
one form for both — and the **year is the build's**, passed in by the component. That
closed the rot #79 named and left: the year had been hard-coded `2026` and would have gone
wrong on 2027-01-01 with nothing to catch it. The residue is real and narrow — this is a
static build, so a year in which the site is never deployed still shows the previous one.

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

`/riders` and `/es/riders` — copy-map §3.3. Rider pillar 2 is ungated and runs; **rider
pillar 3 is gated and absent** (#111), so this page and DriversPage each reserve exactly one
slot and run two pillars at launch. The gated slot was the couplet "Card or cash." / "Pay how
you actually pay.", barred until the app can produce a cash trip
([yeapptech/yeride-mobile#277](https://github.com/yeapptech/yeride-mobile/issues/277)); §5
fails the build on the cash half if it returns, and the support half is human review at copy
time. The component header carries the reasoning.

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

**Ride tier names are site copy, in both languages** (#65). The rate card's name column
and the example's trip line read `serviceName()` from `src/i18n/feeLabels.ts`, keyed by
the service id — the endpoint's own `name` is rendered only as the fallback for an id
the map doesn't cover, which `scripts/check-fee-labels.mjs` fails the deploy on. EN is
authored too, so it stays identical to what the app shows a rider.

**Related:** `src/lib/feeSchedule.ts` (endpoint contract, fetch, formatting),
`src/i18n/feeLabels.ts` (charge labels + family/payer, area names, ride tier labels),
`src/i18n/feesCopy.ts` (page copy, EN/ES).

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

**The two address fields are Google's, and this repo styles them from JavaScript** (#121).
`dressAutocomplete` mounts each `gmp-place-autocomplete` and sets three things on the host:
the §3.5 placeholder (which doubles as the field's accessible name — a custom element is
not labelable, so `<label for>` cannot bind to it), `colorScheme = "light"` (or the
component follows the OS into dark mode and puts a black field on the paper card), and the
boundary — `rounded-xl border border-ink/60`, the pre-registration inputs' own classes.
The shadow root is **closed**, so nothing here can select inside it; the host is the only
surface, and `border` is one of the properties Google documents as overridable on it. Do
not reach for `::part(input)`: it matches the inset text input and excludes the search
icon, so it draws the wrong rectangle. **Two things follow that are easy to break.**
`check-contrast.mjs` cannot see any of this — the tag is not one it watches, the element is
built inside a `<script>`, and the classes are added at runtime rather than written in the
template — so the boundary is correct and ungated. And it is held to
`PreRegistrationForm`'s `inputClass` by hand, so moving that base leaves this field behind
in silence. Measured live at 4.25:1 on the field's own white fill and 4.16:1 on the paper
card, against a default of no border at all. See
`docs/research/117-gmp-place-autocomplete-contrast.md` before restyling it.

**Why it says what it is priced for** (wayfinder #62, premise amended by #73). When #62
wrote this line every quote was for `DEFAULT_SERVICE_AREA_ID` whatever the rider typed, so
the page had to state which area — otherwise the map underneath implies the rider's own and
a Chicago route reads as a Chicago price. **#73 changed the premise and not the
conclusion:** the area is now resolved from the pickup and the constant is only the
fallback (refusal 4 below), and the label stays regardless, because the page still prices
one area, the rider cannot tell which from a map with a route on it, and the two fallback
states are invisible from outside. The line is rendered in the frontmatter, not from the response, because
it must stand in every state including a failed estimate. The constant lives in
`src/lib/serviceArea.ts` rather than `src/lib/fareEstimate.ts` so that reading it here
does not import `src/lib/firebase.ts`, which calls `initializeApp` at module scope.

The label is **"Priced for"**, not "Service area": the latter is the site's coverage
vocabulary (`/es/fees` labels its picker "Área de servicio", and both legal documents
use it that way), so on a page showing the rider's own route it would read as a claim
that the ride is served — the very implicature the ticket removed. The note carries
availability instead, and says a price is not a promise of service rather than naming
the served set, which would be a count nothing on the site checks. The area's bilingual
name is read straight out of `serviceAreaNames`, **not** via `serviceAreaName()`: that
helper humanises an unknown identifier ("Us Fl South Florida") so `/fees` can render an
area it has never heard of, which on this page would publish an English-derived string
on `/es/fare-estimate`. Here a missing name is a defect, so it fails the build.

**Five refusals it enforces.** Read #38 before relaxing any of them:

1. **It shows the fare and nothing else about money.** `estimateFares` used to also
   return `appCharges`/`appChargesTotal`, and `ServiceEstimate` deliberately did not
   declare them, so no page could render them by accident. They are the *driver's* cost
   in both payment flows — itemising them beside a rider's fare would claim the rider
   pays money they do not (copy map §3.5, amended under #47). The endpoint has since
   withdrawn the fields entirely (yeride-functions#47), on the strength of this
   refusal: they had no reader anywhere. The refusal stays as the standing rule for
   whatever the endpoint returns next.
2. **A fare that is not a positive finite number renders as a gap (`—`) — never
   `$0.00`.** This is reachable: `calculateFare` coalesces all four rates to `0`, so a
   `rideServices` document with holes quotes zero, and a published zero says the ride is
   free. Same rule as `FeeSchedule`, same reason.
3. **A quote belongs to the route it was asked for.** A counter retires every in-flight
   quote when either end changes or the form is submitted again, so a reply about an
   abandoned journey can never be rendered under a map showing a different one.
4. **The area is resolved from the rider's PICKUP (#73), and "outside" is a
   three-state answer.** `resolveServiceArea` in `src/lib/serviceArea.ts` runs Haversine
   against each area's published circle — semantics copied from yeride-mobile's
   `ResolveActiveServiceArea`, inclusive at the boundary, first match in document-id
   order on overlap — and returns `inside`, `outside` or **`unknown`**.

   The third state is the honest one and the reason this is not a boolean. `outside`
   requires **every** area to have published a usable circle; if one has not, the rider
   might be in it and nothing can know, so the answer is `unknown`. `unknown` also
   covers a `getFeeSchedule` that cannot be reached — the page must not acquire a third
   hard dependency, so a failed fetch still quotes. Both `unknown` paths fall back to
   `DEFAULT_SERVICE_AREA_ID` and #62's "Priced for" disclosure, which is exactly the
   behaviour the page had before #73.

   **§3.5's "Outside area" line now ships**, on `outside` alone. It is still never
   mapped to `functions/not-found`, which means the requested area has no services
   configured — a fault, not a geography, and mapping it there would tell every rider on
   the site that YeRide does not serve them during an outage.

   The **pickup** decides, matching how a ride is dispatched; a drop-off outside every
   area is not an error and is priced at the pickup area's rates. `scripts/service-area.test.mjs`
   pins all of the above and runs in `npm run checks`.

5. **The "Priced for" label keeps naming the area even when resolution succeeds** (#73
   item 4). The page still prices one area, the rider cannot tell which from a map with
   a route on it, and the two fallback states are invisible from outside — so dropping
   the label on success would show the disclosure only where the site was least certain.

Each result's **tier name and blurb are site copy in both languages** (#65), read from
`serviceName()` / `serviceDescription()` by `serviceId`. Before that the callable's
English `name` and `description` were printed verbatim, so `/es/fare-estimate` said
"Standard sedans with more legroom" under a Spanish heading. A fetched string is now
used only when the map has no entry for that tier id.

Both paragraphs are gated on the **resolved** string, never on the fetched one. Gating
the blurb on `estimate.description` — which the first pass did — lets an empty backend
field suppress copy the site authored and owns, which is the inverse of the rule: the
fetched value is the fallback, not the switch.

**Related:** `src/lib/fareEstimate.ts` (callable contract), `src/lib/serviceArea.ts`
(the area the page prices), `src/lib/firebase.ts` (callable region),
`src/i18n/fareEstimateCopy.ts` (page copy, EN/ES), `src/i18n/feeLabels.ts`
(`serviceAreaNames`, read in the frontmatter for the area's bilingual name; ride tier
labels, read in the result list).

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

**The `copy-gate-allow` pragmas.** `legalCopy.ts` states that YeRide provides no
insurance. Copy-map §5 gates that word on #48 and the gate matches patterns, not meaning,
so it cannot tell that denial from a claim — hence the pragmas, which print on every build.
When #48 lands the statements become *false* and must be rewritten, not merely un-pragma'd.

Those pragmas are stripped by the build, so the same sentences are blessed a **second** time
in `scripts/check-dist-copy-gate.mjs`'s `ALLOWED` list, keyed to the built pages (#57) — by
path, matched text and an exact count. One pragma does not mean one allowance: a pragma
covers its own line and the line below, and §5's `/\b(seguros?|aseguranza|p[óo]liza)\b/`
can match **twice in one sentence** — *"el número de póliza de seguro del vehículo"* is two
words, one sentence. Nor are they all denials: several name the vehicle's insurance policy
number as a field the app collects, and terms §7 states the driver's own duty under Fla.
Stat. § 627.748(7).

**Do not take a count from this page — read it off a build.** The three numbers involved
(pragmas in the source, allowances the source gate prints, entries in the dist list) have
all moved at least once, and a count written in prose is the one copy of it that cannot
fail when it drifts: this paragraph said "four pragmas, five entries" while the source
carried twelve. `npm run checks` prints the live set on every run. That both lists are
self-cleaning is the real safeguard — an entry that stops matching, or matches a different
number of times, fails the build — so editing a legal sentence containing *insurance*,
*seguro* or *póliza*, even to add a second one, fails until both are updated. That cost is
the point: adding one is a decision.

### NotFoundPage / RedirectPage

The bodies of `/404` and `/redirect` (wayfinder #39).

**Location:** `src/components/NotFoundPage.astro`, `src/components/RedirectPage.astro`

**Props: none** — and they are the only page components without `lang`. They render **both**
languages and let `BaseLayout`'s `bilingual` mode reveal one, so there is no second render to
pass a language to. Both iterate `BILINGUAL_LANGS` from `src/i18n/utilityCopy.ts`, one shared
constant, so they cannot disagree about which languages ship.

Copy: `notFoundCopy` and `redirectCopy` in `src/i18n/utilityCopy.ts`, verbatim from
copy-map §3.10 and §3.11.

**`RedirectPage`'s Spanish half is unreachable today**, and the file says so rather than
implying otherwise: §3.11 prescribes the same path-based switch `/404` uses, but the mobile
app opens `yeride.com/redirect` directly and nothing links an `/es/` variant, so
`location.pathname` is always `/redirect`. The ES copy ships because §3.11 authors it, not
because it renders.

`RedirectPage` reveals its manual fallback link after 2s by clearing `hidden` from **every**
`[data-manual-link]` — both language copies — which is safe because the wrapper keeps the
wrong language out of view regardless.

### ContactPage

The body of `/contact` and `/es/contact` (wayfinder #39).

**Location:** `src/components/ContactPage.astro`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lang` | `"en" \| "es"` | **yes** | Selects the copy |

Copy: `src/i18n/utilityCopy.ts` (`contactCopy`), verbatim from copy-map §3.7. Takes `lang`
alone and resolves its own copy, the contract every page component here follows.

**This page is load-bearing beyond its own content.** `/support` redirects here and
`/es/support` to its twin (`astro.config.mjs`, wayfinder #44), and that is the URL
yeride-mobile submits to the app stores as its support contact — a missing one was a 2025
App Store rejection. The address on it was `support@yeride.app`, which nobody reads; §3.7
corrects it to `support@yeride.com`, and it is a `mailto:` link rather than plain text
because it is the only action the page offers.

**There is no form, and that is a decision — do not re-add a third-party embed.** The page
carried an embedded Tally form until #39 amended §3.7 to drop it. Three things settled it:

- The form's **questions lived inside Tally** — the last user-facing copy on this site
  outside the repo, invisible to the copy map and to both copy gates. §3.7 had no cells for
  them at all, where §2.2 specifies every label and placeholder of the pre-registration form
  in both languages.
- **Tally has no runtime localisation**, so `/es/contact` needed a *second* form, authored
  in Spanish and kept in sync by hand forever. That blocked the page in both languages under
  §0.1, and an English form under Spanish chrome is the half-translated page #65 was
  re-opened over.
- Removing it **deleted a named processor** from a privacy policy held for legal sign-off —
  a simpler edit than swapping one vendor for another, which is why a Formspree-class
  replacement was rejected too: it keeps a processor and buys only what an owned endpoint
  would.

The address was already a live `mailto:` in both legal documents, so publishing it here
exposed nothing new, and the store requirement is a reachable support **URL**, not a form.

If structured intake is wanted later, the shape to copy is **`PreRegistrationForm`** —
markup and per-field EN/ES copy in `src/i18n/`, posting to an endpoint YeRide owns — with a
copy-map amendment giving §3.7 the field cells §2.2 has.

### AboutPage

The body of `/about` and `/es/about` (wayfinder #85).

**Location:** `src/components/AboutPage.astro`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lang` | `"en" \| "es"` | **yes** | Selects the copy |

Copy: `src/i18n/aboutCopy.ts` (`aboutCopy`), verbatim from copy-map §3.6. Takes `lang` alone
and resolves its own copy, the contract every page component here follows.

A prose page, so it takes **`ContactPage`'s measure** rather than the audience pages' pillar
stack — one paper ground, one `max-w-3xl` column, sections in exactly §3.6's slot order: H1,
identity paragraph, mission, the four values, entity line. The four values are the only list,
and they are a list in the copy map too.

**The identity paragraph is the brand's paragraph quoted in part, and that is the whole point
of the component.** `docs/identity.md` carries a "Who we are" paragraph in each language
(the ES one authored by yeapptech/yeride-brand#22), marked verbatim-only — and **neither is
usable whole**, because each states the suspended pass-through family as fact and each carries
hard-coded money, so copy-map §5 fails the build on both, in both languages. §3.6 writes out
the exact surviving text — the brand's own words, unedited and in its own order, **two spans
omitted and nothing rewritten, resequenced or translated** — and this component takes it from
§3.6 rather than from the brand doc. The argument for each omission is on `aboutCopy.ts`:

- **The fee sentence** returns when [#48](https://github.com/yeapptech/yeride-website/issues/48)
  lands. That is an edit to `aboutCopy.ts` alone — do not restore it anywhere else.
- **The origin sentence** carries hard-coded money (copy-map §0.4). It was cut rather than
  blessed with a `copy-gate-allow`, because a pragma buys a permanent hole in the one rule
  keeping invented figures off this site.

Two things a reader might otherwise take for defects. §3.6 sets the paragraph in markdown with
a **bold lead sentence and italicised word mentions**; those are the document's formatting, not
copy — this site's copy modules are plain strings everywhere and nothing renders `set:html`, so
the emphasis is dropped and the words are unchanged. And the **entity line repeats** the
paragraph's closing sentence in fuller form: §3.6 specifies both slots, they sit four sections
apart, and with the origin sentence cut the entity line is the only surviving mention of
Hernando Sierra.

`/about` is linked from the **footer only** — copy-map §1.2, and §1.1's header has no About
slot — so `Footer.astro` already carried it in both languages and shipping this page needed no
nav change.

## Page-Specific Components

### Homepage (index.astro)

Nothing page-specific any more: `index.astro` is a thin `BaseLayout` + `HomePage` wrapper
(wayfinder #37), like every other redesigned route. The gradient hero, feature cards,
two-column rider/driver comparison, embedded form and App Store badge documented here
before are all gone.

### Contact Page (contact.astro)

Nothing page-specific any more: `contact.astro` is a thin `BaseLayout` + `ContactPage`
wrapper (wayfinder #39). The three shadow cards documented here before are gone — §3.7 cut
"Response Time — Within 24 hours" as an unbacked service promise and replaced "Location —
United States" with the brand's South Florida line. See **ContactPage** above.

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

JavaScript is used sparingly, and **exactly five files carry a `<script>`**:

| File | What its script is for |
|---|---|
| `PreRegistrationForm.astro` | Field validation and the POST to the register endpoint |
| `FeeSchedule.astro` | Fetches the live fee schedule and renders the rate card |
| `FareEstimatePage.astro` | Google Maps, autocomplete, Directions, and the `estimateFares` call |
| `RedirectPage.astro` | The bounce to the `yeride://register` deep link |
| `BaseLayout.astro` | `bilingual` mode's language stamp — inline, and it must stay inline |

There is **no mobile menu toggle and no smooth scrolling**; this section described both
until #42's audit, along with a `#menu-toggle` / `#mobile-menu` sample for elements that
have never existed in `src/`. `Header` has no hamburger (see its own section above), and
nothing in `src/` sets `scroll-behavior` or calls `scrollIntoView`. If you need a pattern to
copy, read one of the five files above rather than a sample in this document — a sample
here is a sixth copy of something that can drift, which is exactly how the removed one
survived.

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
