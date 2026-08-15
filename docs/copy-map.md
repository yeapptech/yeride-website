# YeRide website — per-page EN/ES copy map

Resolves [yeapptech/yeride-website#34](https://github.com/yeapptech/yeride-website/issues/34) (wayfinder map [#30](https://github.com/yeapptech/yeride-website/issues/30)).

This is the copy the page-implementation tickets execute **verbatim**. Where a string is
marked **canonical**, it comes from `@yeapptech/yeride-brand` `docs/messaging.md` and must
not be reworded, re-cased, or re-punctuated. Everything else is support copy authored for
this site — rephrasable in future campaigns, but binding for this build.

Sources: `docs/messaging.md`, `docs/positioning.md`, `docs/identity.md` (brand repo, binding);
`research/fee-schedule-source.md` and `research/cash-statute.md` (this repo, closed research
tickets); the approved Variant D comp from [#33](https://github.com/yeapptech/yeride-website/issues/33).

---

## 0. Global rules

1. **EN and ES ship together.** No page merges with one language.
2. **Spanish is authored, not translated.** Informal **tú** throughout. Pan-Latin Miami
   vocabulary — *carro* not *coche*, *manejar* not *conducir*. No voseo, no Spain-isms.
   The one exception is the legal pages (§ 3.8, § 3.9), which are formal-register
   translations by deliberate decision.
3. **Routes are mirrored with English slugs.** `/drivers` → `/es/drivers`. Every page has an
   `/es/` twin except `/404` and `/redirect` (§ 3.10, § 3.11).
4. **No fee amount is ever hard-coded in copy.** Amounts render only from the live fetch.
5. **Gated copy must not appear anywhere.** See § 5.

---

## 1. Shared chrome

### 1.1 Header

Order is fixed. Audience pages first, then the two proof pages, then the toggle.

| Slot | EN | ES |
|---|---|---|
| Logo alt | YeRide | YeRide |
| Nav 1 → `/drivers` | Drivers | Maneja |
| Nav 2 → `/riders` | Riders | Viaja |
| Nav 3 → `/fees` | Fees | Tarifas |
| Nav 4 → `/fare-estimate` | Fare estimate | Estimar tarifa |
| Language toggle | ES | EN |
| Toggle `aria-label` | Ver esta página en español | View this page in English |

The toggle preserves the current page (`/fees` ⇄ `/es/fees`). At the narrowest breakpoint the
comp drops nav links; the **mark and the toggle always survive** — ES parity is not a
progressive enhancement.

### 1.2 Footer

| Slot | EN | ES |
|---|---|---|
| Link → `/about` | About | Nosotros |
| Link → `/contact` | Contact | Contacto |
| Link → `/privacy-policy` | Privacy Policy | Privacidad |
| Link → `/terms` | Terms | Términos |
| Place line | Built in South Florida. | Hecho en el Sur de la Florida. |
| Entity line | YeRide is built by YeAPP TECH LLC, a Florida software company. | YeRide es un producto de YeAPP TECH LLC, una empresa de software de la Florida. |
| Copyright | © 2026 YeRide | © 2026 YeRide |

**Social links: X/Twitter only** — `https://twitter.com/yeride_app`, `aria-label` "YeRide on X"
/ "YeRide en X". The Facebook and Instagram icons are **removed**; they pointed at `#`. Do not
re-add a social icon without a working URL.

The "Terms of Service" link previously pointed at `#`. It now points at the real `/terms` page
(§ 3.9).

---

## 2. Shared blocks

### 2.1 Availability block

Runs directly beneath the pre-registration form on `/drivers` and `/riders`, and in the form's
success state. This is the page's honest statement of what exists today.

| Slot | EN | ES |
|---|---|---|
| Lead | YeRide is live on Android. | YeRide ya está en Android. |
| Play badge alt | Get it on Google Play | Disponible en Google Play |
| iOS line | iOS is in beta — join the TestFlight. | iOS está en beta — únete al TestFlight. |

**There is no App Store badge.** There is no App Store listing; the badge that shipped
previously linked to TestFlight. It is removed and must not return until a public App Store
listing exists.

### 2.2 Pre-registration form

One component, embedded on `/drivers` and `/riders`, with `role` **pre-set by page** — the
dropdown is removed. Heading differs by page (§ 3.2, § 3.3); everything below is shared.

| Slot | EN | ES |
|---|---|---|
| First name label | First name | Nombre |
| First name placeholder | Your first name | Tu nombre |
| Last name label | Last name | Apellido |
| Last name placeholder | Your last name | Tu apellido |
| Email label | Email | Correo electrónico |
| Email placeholder | you@example.com | tucorreo@ejemplo.com |
| Phone label | Phone | Teléfono |
| Phone placeholder | +1 305 555 0100 | +1 305 555 0100 |
| Submit | Pre-register | Pre-regístrate |
| Submitting | Sending… | Enviando… |

**Validation (client-side, shown per field):**

| Case | EN | ES |
|---|---|---|
| Required field empty | This one's required. | Este campo es obligatorio. |
| Email malformed | That doesn't look like an email address. | Ese correo no parece válido. |
| Phone malformed | Include the country code, like +1 305 555 0100. | Incluye el código de país, como +1 305 555 0100. |

**Server outcomes — by failure class. The raw API string is logged, never displayed.**

| Class | EN | ES |
|---|---|---|
| Success | You're pre-registered. | Ya estás pre-registrado. |
| Email already registered | That email is already registered. | Ese correo ya está registrado. |
| Phone already registered | That phone number is already registered. | Ese teléfono ya está registrado. |
| Rejected input (4xx) | Check the details and try again. | Revisa los datos e intenta de nuevo. |
| Network / unreachable | We couldn't reach the server. Try again in a moment. | No pudimos conectar. Intenta de nuevo en un momento. |
| Anything else (5xx) | Something went wrong. Try again. | Algo salió mal. Intenta de nuevo. |

The success state renders the availability block (§ 2.1) beneath the success line, so the
person is told where the app actually is.

**Amended 2026-08-02 (#37)** — read off the endpoint while building the audience pages.
`POST ${PUBLIC_API_URL}v1/auth/register` is yeride-admin-api's `auth` controller
(`functions/src/controllers/auth/auth.controller.ts`), and it settles three things this
section had wrong:

1. **The password fields are cut.** The controller destructures `firstName`, `lastName`,
   `email`, `phoneNumber` and `role`, and nothing else — `password` is commented out of its
   own `RegisterUserData` interface. A password typed here would be sent over the wire and
   dropped, while telling the person they now hold a credential they do not. Both field rows
   and both password validation rows are gone. (They were already commented out in the
   shipped form; this makes that deliberate.)
2. **A duplicate phone number gets its own line.** The controller dedupes on email *and*
   phone against the `whitelist` collection, returning 409
   `pre-registration/phone-number-already-in-use` for the second — so the outcome table now
   carries that class. Without it a repeat phone was told the wrong thing about their email.
   Sites match on the `code`, not the status.
3. **The phone is normalised to E.164 before the POST.** Dedupe is an exact string match on
   `phoneNumber`, which the controller stores verbatim, so two spellings of one number are
   two people to it: "+1 305 555 0100" as typed must go over the wire as `+13055550100`.

   *Scope of that claim, corrected 2026-08-02 after review:* rows created **through this
   site** are `+1XXXXXXXXXX`, because the form it replaced forced `^\+1\d{10}$`. Nothing was
   read from the database, so rows written by any other client are not covered — if legacy
   rows are formatted differently, normalising defeats dedupe rather than serving it.
   Confirming that needs a read of the `whitelist` collection, not of the source.

   A related trap the first implementation fell into: normalising by discarding every
   non-digit turns a trailing extension into a plausible number. Strip **formatting
   characters only**, and pin `+1` to exactly 11 digits — the general E.164 range of 10–15
   accepts both a US number with a digit missing and one with an extension run onto the end,
   and each writes a second row beside the same person.

> **Flagged, decided against changing (2026-07-31; premise corrected 2026-08-02):** Android
> is already live, so "pre-register" is a label the product has outgrown. Keeping the
> pre-registration framing was an explicit call. The copy above therefore never says
> "early access", "coming soon", or "when we launch": pairing the label with § 2.1 keeps
> the page truthful even though the label is loose. The original note said this form
> "creates a real production account" — it does not. It adds a row to `whitelist` with
> `registrationCompletedAt: null`, which is pre-registration exactly as labelled.

### 2.3 Fee label map

Fee line names arrive from the database as a single `description` string per charge. The site
keeps an ES lookup keyed by the charge `id`, used by `/fees` — and by `/fees` alone, since
§ 3.5's fee block was cut. `/fare-estimate` renders no **charge** lines and needs no charge
labels; it does read this file's **ride tier** map, added below by #65.

```ts
// src/i18n/feeLabels.ts — ids VERIFIED against production 2026-08-01 (#47)
export const feeLabels: Record<string, ChargeLabel> = {
  bookingCharge:          { en: 'Booking charge',              es: 'Cargo por reserva' },
  dispatchCharge:         { en: 'Dispatch charge',             es: 'Cargo por despacho' },
  pickupBandwidthCharge:  { en: 'Ride technology — to pickup', es: 'Tecnología del viaje — hasta la recogida' },
  dropoffBandwidthCharge: { en: 'Ride technology — on trip',   es: 'Tecnología del viaje — en ruta' },
};
```

**Amended 2026-08-02 (#47).** The earlier keys here (`booking-fee`, `platform-fee`,
`trip-insurance`, `card-processing`) were the names `docs/positioning.md` uses, not real ids.
Production uses camelCase and a different set entirely, so every charge fell through to the
fallback and leaked its English `description` onto `/es/fees` until this was corrected.

The two "bandwidth" charges are internal jargon for **the technology YeRide provides the driver
to run a ride** — directions, maps, tracking, payments — metered per minute across the two legs.
They are named for what they are; the admin console still calls them bandwidth.

The real map also carries a `family` and a `payer` per charge, because neither is a database
field and neither can be inferred: see § 3.4 on why `payer` is `driver` for all four.

An **unknown id falls back to the backend `description` verbatim in both languages**, and the
build check (#41) fails on any id the map doesn't cover, so a new charge is a visible, fixable
miss rather than a silent English leak.

#### Service-area display names — the site's job, and staying there

**Decided 2026-08-02 (#47).** Area documents carry an `identifier` slug and **no display-name
field**, so `/fees`'s picker labels live beside the fee labels, in `serviceAreaNames`. They stay
there rather than moving to a backend `name` field on the area document.

An area name is **bilingual brand copy, not data**. One backend string ships one language, so
`/es/fees` would show an English name — the exact failure the charge-id rekey above was opened
to fix — and two of the three servable stage areas are Spanish-speaking. A bilingual backend
field would work, but it is a larger ask for copy the site already owns, and splitting it
(backend EN, site ES) breaks **EN and ES ship together or not at all**.

The map is therefore keyed by language:

```ts
// src/i18n/feeLabels.ts
export const serviceAreaNames: Record<string, Record<Lang, string>> = {
  'us-fl-south-florida': { en: 'South Florida', es: 'Sur de la Florida' },
};
```

The cost is that a **new area needs a web deploy to launch with a real name**; until then it
falls back to its humanised identifier ("Us Mi Detroit") in both languages. #56 makes that
visible rather than silent: it fails the build on an area id this map doesn't cover, the same
treatment it gives an uncovered charge id.

#### Ride tier names — copy, not brand names

**Decided 2026-08-03 (#65).** `rideServices[].name` and `.description` arrive from the
database in English and were rendered verbatim in both languages, so `/es/fees`' rate card read
**Economy · Comfort · Comfort Plus · Luxury · Luxury Plus** and `/es/fare-estimate` printed
English sentences under each tier ("Standard sedans with more legroom").

The question was whether a tier is a **proper noun** — the way Uber keeps "Comfort" in
Spanish-language markets — or ordinary copy. It is copy:

- `@yeapptech/yeride-brand` **names no tier anywhere** — not in `messaging.md`,
  `positioning.md`, `brand-system.md`, `identity.md` or `logo.md`. There is no brand asset to
  protect, so "brand name" had nothing behind it but the habit.
- § 3.4 authors **every other cell** of this rate card in both languages. The tier column was a
  gap in that method, not an exception to it.
- The names are operator free-text in the admin console — the ids are `economy`, `comfort`,
  `comfort_plus`, `luxury`, `luxury-plus`, whose separators disagree with each other. That is
  data entry, not a naming system.

**EN is authored here too**, exactly as a charge label is. That is the point rather than a side
effect: rendering the fetched string on `/fees` and an authored one on `/es/fees` is what leaks
English in the first place, and pinning EN keeps it **byte-identical to what the app shows a
rider** — the one real cost of translating. Both apps are English-only (yeride-mobile has no
i18n at all; the legacy app on Play renders `Order {name} Service`), so a Spanish reader matches
"Económico" here to "Economy" there. Their own docs call that temporary — *"localization is a
post-cutover concern"* — and nothing about keeping the website English would have made the app
speak Spanish sooner.

| id | EN name | ES name | EN description | ES description |
|---|---|---|---|---|
| `economy` | Economy | Económico | Affordable rides, compact cars | Viajes accesibles, autos compactos |
| `comfort` | Comfort | Confort | Standard sedans with more legroom | Sedanes estándar con más espacio para las piernas |
| `comfort_plus` | Comfort Plus | Confort Plus | SUVs or minivans | SUV o minivans |
| `luxury` | Luxury | Lujo | Luxury ride | Viaje de lujo |
| `luxury-plus` | Luxury Plus | Lujo Plus | SUVs Luxury ride | SUV de lujo |

The **EN column is the operator's own wording, transcribed from production 2026-08-03, not
rewritten.** "SUVs Luxury ride" reads oddly; improving it is a copy decision for this map to
take deliberately, not something to smuggle in under a translation ticket. The Spanish is
written to be natural rather than word-for-word — English "Affordable" is not "Economy", so
neither is the Spanish.

An **uncovered id falls back to the backend `name` / `description` verbatim**, in both
languages — never to a humanised id the way an area must, because a ride service document *has*
a real name field and there is no reason to invent "Luxury Plus" out of `luxury-plus`. Hiding
the row instead would suppress a published price on the page that exists to publish them. #56
fails the deploy on a tier id this map doesn't cover, across every area, the same treatment it
gives a charge id and an area id.

It **cannot** catch an *edited* description — that is prose an operator may reword, and no
check here can see it. That is the accepted cost of having the two languages agree at all; it
is the same trade `serviceAreaNames` above makes.

---

## 3. Pages

### 3.1 `/` and `/es/` — home

Structure is the approved Variant D language (Cab Yellow → Ink → Paper), with the audience fork
moved **up into the hero** and `/fees` demoted to the nav and the paper strip.

**Yellow hero** — the mark leads; no wordmark lockup on yellow.

| Slot | EN | ES |
|---|---|---|
| H1 **(canonical)** | Your ride, fair and clear. | Tu viaje, justo y claro. |
| Sub | Published rates — base, miles, minutes. The fare follows the ride. | Tarifas publicadas — base, millas, minutos. El precio sigue al viaje. |
| CTA 1 → `/drivers` | Drive with YeRide | Maneja con YeRide |
| CTA 2 → `/riders` | Ride with YeRide | Viaja con YeRide |

**Ink band** — the two offers. No buttons; each half links as a whole block.

| Slot | EN | ES |
|---|---|---|
| Eyebrow, left (Cab Yellow text — legal on Ink only) | For drivers | Para quien maneja |
| H2 left **(canonical)** | Keep what you earn. | Lo que ganas es tuyo. |
| Support left | No commission. Flat, published tech fees — never a percentage of the fare. | Sin comisión. Cargos de tecnología fijos y publicados — nunca un porcentaje de la tarifa. |
| Eyebrow, right | For riders | Para quien viaja |
| H2 right **(canonical)** | Pay what the ride is worth. | Paga lo justo. |
| Support right | Your fare goes to the person driving — not to a percentage cut. | Tu tarifa es para la persona que maneja — no para la comisión de una app. |

**Paper strip** — the facts, the limit, the fee link.

| Slot | EN | ES |
|---|---|---|
| Fact 1 | No commission. | Sin comisión. |
| Fact 2 | Flat, published fees. | Cargos fijos y publicados. |
| Limit note | Estimates are estimates — the meter decides. | Un estimado es un estimado — el taxímetro decide. |
| Link → `/fees` | See the fee schedule | Ver el tarifario |

**The strip runs two facts, not three** *(2026-08-10, #111)*. Fact 3 was "Card or cash." /
"Tarjeta o efectivo.", barred by `docs/positioning.md` until the app can produce a cash trip;
§ 5 records the bar. **No replacement fact was authored, deliberately** — canonical copy comes
from `docs/messaging.md`, which is the document being rewritten in
[yeride-brand#124](https://github.com/yeapptech/yeride-brand/issues/124), so inventing one
here is the precedence-invention `positioning.md` refuses.

The home page carries **no pre-registration form**. Its job is the fork.

### 3.2 `/drivers` and `/es/drivers`

Pillars are the spine, in `docs/messaging.md` order. Driver pillar 2 is **gated and absent**;
its slot placement was decided in
[#43](https://github.com/yeapptech/yeride-website/issues/43) and is recorded below.

| Slot | EN | ES |
|---|---|---|
| Eyebrow | For drivers | Para quien maneja |
| H1 **(canonical, pillar 1)** | Keep what you earn. | Lo que ganas es tuyo. |
| Support | YeRide takes no commission. You pay flat, published tech fees — never a percentage of the fare. No subscriptions, no hidden fees. | YeRide no cobra comisión. Pagas cargos de tecnología fijos y publicados — nunca un porcentaje de la tarifa. Sin suscripciones, sin cargos escondidos. |
| *(gated pillar-2 slot — #43)* | — | — |
| H2 **(canonical, pillar 3)** | Trying costs nothing. | Probar no cuesta nada. |
| Support | Run YeRide alongside Uber and Lyft. You were driving anyway. | Usa YeRide junto a Uber y Lyft. Igual ya estabas manejando. |
| Fee pointer H3 | Flat, published fees. No commission. | Cargos fijos y publicados. Sin comisión. |
| Fee pointer link → `/fees` | See exactly what you pay | Mira exactamente lo que pagas |
| Form heading | Pre-register as a driver | Pre-regístrate para manejar |
| Form sub | Takes a minute. | Toma un minuto. |

Form `role` is pre-set to `driver`. Availability block (§ 2.1) sits beneath the form.

**The gated pillar-2 slot** (#43) sits between pillar 1 and pillar 3 — the canonical
`docs/messaging.md` order — so the two money-transparency claims group, and "Trying costs
nothing." stays next to the fee pointer and the form. When the gate lifts it takes the same
shape as pillar 3: an H2 plus a support paragraph. Its authored EN/ES pair is **not duplicated
here** — pull it from `docs/messaging.md` § Core message set → Drivers → 2, which is the
binding source.

At launch **nothing occupies the slot but a plain comment** naming #43, in `/drivers` and
`/es/drivers` alike. No gated string enters `src/`, so the copy gate (§ 5, #41) stays absolute:
any hit on "See the math" is a real failure with no allowlist entry. The comment is
deliberately **not** a `copy-gate-allow` pragma — #41 fails the build on a pragma that matches
nothing. Because the page is a stack of identically-shaped pillar sections, lifting the gate is
an insert, not a redesign.

**The home page never carries pillar 2.** § 3.1's Ink band is a symmetric 2-up fork; its job is
to fork, not to carry a pillar set. The two pages are symmetric in block vocabulary — eyebrow,
pillars, fee pointer, form, availability — not in section count.

**Each audience page now reserves exactly one slot** *(2026-08-10, #111; this paragraph
previously said "/riders reserves nothing")*. `/drivers` gates pillar 2 on obligations 1–3;
`/riders` gates pillar 3 on obligation #5, the cash capability
([yeapptech/yeride-mobile#277](https://github.com/yeapptech/yeride-mobile/issues/277)). Rider
pillar 2 is ungated (§ 5) and runs at launch in its natural position. So at launch the two
pages run **two pillars each**, and `/drivers` runs one more once **its** gate lifts — the
reverse of the imbalance this paragraph used to record. Because each page is a stack of
identically-shaped pillar sections, lifting either gate is an insert, not a redesign.

**Uber and Lyft are named here and only here** — `docs/positioning.md` licenses driver-facing
copy to say "run YeRide alongside Uber and Lyft", and says rider copy should not name them.
No invented per-trip price or earnings comparison appears anywhere; no earnings dollar figure
appears anywhere.

### 3.3 `/riders` and `/es/riders`

| Slot | EN | ES |
|---|---|---|
| Eyebrow | For riders | Para quien viaja |
| H1 **(canonical, pillar 1)** | Pay what the ride is worth. | Paga lo justo. |
| Support | Your fare goes to the person driving — not to a percentage cut. | Tu tarifa es para la persona que maneja — no para la comisión de una app. |
| H2 **(canonical, pillar 2)** | Same math every trip. | Las mismas cuentas en cada viaje. |
| Support | Published rates — base, miles, minutes. The fare follows the ride, not what an app thinks you'll pay. | Tarifas publicadas — base, millas, minutos. El precio sigue al viaje, no lo que la app cree que puedes pagar. |
| Fee pointer H3 | Every fee, published. | Cada cargo, publicado. |
| Fee pointer link → `/fees` | See the fee schedule | Ver el tarifario |
| Estimate link → `/fare-estimate` | Estimate a fare | Estima una tarifa |
| Form heading | Pre-register as a rider | Pre-regístrate para viajar |
| Form sub | Takes a minute. | Toma un minuto. |

Form `role` is pre-set to `rider`. Availability block (§ 2.1) sits beneath the form.

**Rider pillar 3 is gated and absent** *(2026-08-10, #111)*. It was the support couplet
"Card or cash." / "Pay how you actually pay." — canonical in `docs/messaging.md`, marked
*supporting* there, and it ran as a lead-in line inside the pillar stack, never as a section
headline. It is barred by `docs/positioning.md` until the app can produce a cash trip
(obligation #5, [yeapptech/yeride-mobile#277](https://github.com/yeapptech/yeride-mobile/issues/277));
§ 5 records the bar and the two patterns that now fail the build on it. **Both halves went**,
not just the line: "Pay how you actually pay." is the same payment-choice claim in other
words and means nothing without a choice — but it carries no cash word, so no gate holds it
and it is human review at copy time.

[`research/cash-statute.md`](https://github.com/yeapptech/yeride-website/blob/research/cash-statute/research/cash-statute.md)
is **not** the live question and should not be read as clearing the line: Fla. Stat. § 627.748
imposes no electronic-payment mandate, so the law permits cash. The product cannot produce it.

### 3.4 `/fees` and `/es/fees`

Ships positioning obligation #3. All amounts come from the live fetch; **nothing is
hard-coded**. Two families, in `docs/positioning.md` order. The page carries a
**service-area picker** fed by the fetched available-areas list — every figure on the
page re-fetches for the chosen area — and the rate card includes each service's
cancellation fee. The example renders as a two-column **rider-pays / driver-keeps**
breakdown whose money reconciles across both columns. *(Amended 2026-07-31 per the
#36 prototype reactions.)*

> **Amended 2026-08-02 (#47) — read this before executing the table below.**
>
> **The pass-through family currently has zero members, and its rows must not ship.**
> Neither charge it describes exists. Insurance has not been sourced from a carrier yet
> (#48). Card processing is not YeRide's to pass through at all: drivers are onboarded as
> Stripe **standard** Connect accounts on **direct charges**, so Stripe bills the driver's
> own connected account and the platform never touches it. The family-2 heading, lead and
> insurance note below are therefore **suspended** — kept for when #48 gives them members
> again, gated by #41 until then. The lead and the two meta descriptions were corrected in
> production on 2026-08-01 for the same reason.
>
> **Card processing is now its own section, not a family-2 note.** The old "Card note" row
> is gone, replaced by the **Stripe H2 / body / link** rows below. Filing it under "passed
> through at cost" implied YeRide handles the money, which it does not — Stripe bills the
> driver directly. It sits **in neither family**, after the example and before surge, and is
> **static**: like surge, it holds in every fetch state, because it never comes from the
> fetch. It carries **no figure** — YeRide neither sets nor controls Stripe's rate, and with
> standard Connect accounts it is between the driver and Stripe, so naming one would assert a
> third party's pricing and break § 0.4. The link does that job. Shipped 2026-08-02.
>
> **The ledger's sides were backwards.** This section had the rider paying "metered fare +
> YeRide tech fees + rider insurance share". In reality **every YeRide charge comes out of
> the driver's side** (`yeride-functions lib/payments.js` L268–310): on card the rider is
> charged `priceFare` — the metered fare and nothing else — while `appChargesTotal` is taken
> from the driver's connected account as the application fee; on cash the rider pays the
> driver directly and YeRide then bills the driver's account for the same total. So the
> rider's column is **one line, the metered fare**, and the driver's column is the fare minus
> YeRide's published charges. The site now splits the ledger by `payer` alone, never by
> family.
>
> **The driver's total is labelled for what it excludes.** Stripe's fee has no publishable
> amount, so the driver's column cannot be exact on a card fare — a bare "Total" would
> overstate take-home. It reads **"Total — before card processing"**, with the Stripe section
> immediately below answering it. The "Total — card fare" label returns automatically if a
> card-only charge is ever itemised.
>
> **The cash copy is gone, and it is barred rather than merely removed (2026-08-10, #107).**
> `docs/positioning.md` demoted differentiator #5 and put **cash — in any form** on the
> "Never claimed" list, naming both *"cash or card"* and *"cash fares carry no processing
> fee"* explicitly, until obligation #5 ships cash payment in the app. So three things went:
> the conditional **example cash note** (which was gated on a card-only charge and rendered
> for nobody), and the sentence *"Cash fares have none."* from the **Stripe body** and from
> the dead `cardNote` string. Two distinctions worth keeping. **The two claims fail
> differently.** *"Cash fares carry no processing fee"* is **not established in either
> direction** — the fare never passes through Stripe, but the tech fee on a cash ride is
> still a real Stripe charge against the driver's connected account, and whether Stripe's
> per-transaction cost falls on it was never measured — while *"cash is available"* is
> simply **false today**, because `yeride-mobile` writes `type: 'card'` and nothing else.
> The latter is the more serious, being a public statement about a capability the product
> does not have. **And only one of the three was ever read.** The Stripe body.
> `cardNote` lost its row when card processing became its own section and nothing reads it,
> and the cash note's condition is never met — which is exactly why the removal had to be
> driven off the bar rather than off what a reader can see. **"Total — card fare" stays**:
> it distinguishes a total that is exact from one taken before Stripe's fee, not a payment
> method the rider may choose, and it too renders for nobody today. **This section is not
> the whole bar**, and the review of #107 found it reaches further than #107 knew: the
> **terms of service** say *"You can pay by card or in cash."* in both languages
> (`src/i18n/legalCopy.ts`), which is the barred capability claim stated as a term of the
> agreement rather than as marketing. *"Card or cash."* is canonical in `docs/messaging.md` and also ran on
> the home page and `/riders` in both languages; positioning §"Never claimed" records that
> `messaging.md` is stale against it and directs that the disagreement be treated as a bar
> until [yeride-brand#124](https://github.com/yeapptech/yeride-brand/issues/124) lands.
> **All of that is now done** — [#111](https://github.com/yeapptech/yeride-website/issues/111)
> struck the terms-of-service block, the home fact and the `/riders` couplet in both
> languages, **acted on positioning's stopgap rather than waiting for brand#124**, and gave
> § 5 the two pattern layers that fail the build if any of it returns. brand#124 was still
> open when it landed, and § 5 records why that did not block: brand#124 settles which
> document is right, obligation #5 settles whether the claim is true.
>
> **The rows #40 authored are now blessed and owned by this map (2026-08-02, #47).** They
> were **Other-charges H2 / lead**, the neutral panel an unclassifiable charge falls into
> rather than being guessed into a family, and **Example withheld**. The map owner reworded
> one and split the other; both are ordinary rows below, no longer provisional.
>
> **Each withholding now states its own cause — one string per cause, never one for all.**
> The single **Example withheld** row covered three different branches: the endpoint returned
> no example, the site can't classify a charge, and a charge priced in the schedule is missing
> from the example. It named only the second. Because the endpoint returns `example: null`,
> production shipped *"until every published charge is described above"* while every published
> charge **was** described above — a false reason, which is the same class of error as guessing
> a charge into a family. It is now **three rows, one per branch**.
>
> *Corrected 2026-08-02, after review.* The first pass split three causes into **two** rows,
> leaving `!classified` and `!priced` sharing the undescribed-charge wording. Since every
> production id is classified, `!priced` was that row's only reachable trigger — and its cause
> is that the endpoint priced a charge in the schedule and **left it out of the example**, with
> every charge described. The same false reason, surviving on the branch that hadn't been split.
> **Example withheld — the example is incomplete** now states it, and is the likeliest of the
> three once yeride-functions#21 ships, for exactly the reason the example is null today.
>
> **A charge with no statable rule is explained.** Its amount column shows `—`. Honest, but
> silent on a page whose lead promises current amounts, so a panel containing one carries the
> **Gap note** row. It is conditional and renders for nobody once yeride-functions#21 publishes
> the rule.
>
> The note is phrased around the **missing amount, never around the `—` that fills it**. It
> first read *"A — means…"*, which was false about most of the dashes on screen: the marker is
> U+2014 and so is the em dash inside the charge labels "Ride technology — to pickup" / "— on
> trip", agreed in the same session. Copy on this page must not be keyed to a glyph that also
> appears in fetched or authored names.
>
> **"Other charges" says YeRide, not "the platform".** Every other line on this page owns the
> charge by name; distancing language reads as evasion on a page whose whole pitch is
> transparency.
>
> **Still open:** `getFeeSchedule` returns `example: null`, so the ledger stays withheld in
> production regardless, and `pickupBandwidthCharge` publishes a gap because its expression
> is not summarisable. Both are yeapptech/yeride-functions#21.

| Slot | EN | ES |
|---|---|---|
| H1 | The fee schedule | El tarifario |
| Lead | Every fee YeRide charges. Current amounts, fetched live. | Cada cargo que cobra YeRide. Montos actuales, en vivo. |
| Area picker label | Service area | Área de servicio |
| Rate card H2 | The rate card | El tarifario base |
| Rate card tier name **(added #65)** | *from § 2.3's ride tier map, keyed by the service id* | *ídem* |
| Rate row: base | Base | Base |
| Rate row: distance | Per mile | Por milla |
| Rate row: time | Per minute | Por minuto |
| Rate row: minimum | Minimum fare | Tarifa mínima |
| Rate row: cancellation | Cancellation fee | Cargo por cancelación |
| Unit note | Metered per kilometer; the per-mile figure is an exact conversion. | Se mide por kilómetro; la cifra por milla es una conversión exacta. |
| Family 1 H2 | YeRide tech fees | Cargos de tecnología de YeRide |
| Family 1 lead | Flat, per-trip, published. This is how YeRide earns — never a percentage of the fare. | Fijos, por viaje y publicados. Así gana YeRide — nunca un porcentaje de la tarifa. |
| Family 2 H2 **(SUSPENDED — #48)** | Passed through at cost — zero markup | Trasladados al costo — sin recargo |
| Family 2 lead **(SUSPENDED — #48)** | Costs YeRide forwards without touching. | Costos que YeRide traslada sin tocar. |
| Insurance note **(SUSPENDED — #48)** | The coverage Florida requires during a ride. The rider's share and the driver's share are separate, published lines. | La cobertura que la Florida exige durante el viaje. La parte de quien viaja y la de quien maneja son líneas separadas y publicadas. |
| Other-charges H2 | Other charges | Otros cargos |
| Other-charges lead | Charges YeRide publishes that this page doesn’t describe yet. | Cargos que YeRide publica y que esta página todavía no describe. |
| Gap note **(conditional — renders only in a panel holding a charge whose rule the endpoint can't summarise; must not be keyed to the `—` glyph)** | A charge with no amount shown is one YeRide hasn’t published a rule for that this page can state plainly. | Un cargo sin monto es uno para el que YeRide todavía no publica una regla que esta página pueda expresar con claridad. |
| Example H2 | Example at today’s rates | Ejemplo con las tarifas de hoy |
| Example note | Computed from the schedule above, not a quote. | Calculado con el tarifario de arriba; no es una cotización. |
| Example withheld — **no example published** *(the branch that ships today)* | YeRide hasn’t published an example trip for this area yet. | YeRide todavía no publica un viaje de ejemplo para esta área. |
| Example withheld — **the example is incomplete** *(endpoint published an example but left a priced charge out of it)* | YeRide’s example trip leaves out one of the charges above, so it wouldn’t add up. | El viaje de ejemplo de YeRide deja fuera uno de los cargos de arriba, así que no cuadraría. |
| Example withheld — **a charge is undescribed** *(site-side safety net; renders for nobody today)* | The example is unavailable until every published charge is described above. | El ejemplo no está disponible hasta que cada cargo publicado esté descrito arriba. |
| Example rider col H3 | What the rider pays | Lo que paga quien viaja |
| Example driver col H3 | What the driver keeps | Lo que le queda a quien maneja |
| Example row: fare | Metered fare | Tarifa del taxímetro |
| Example row: fees | YeRide tech fees | Cargos de tecnología de YeRide |
| Example row: rider total | Total | Total |
| Example row: driver total — **default** | Total — before card processing | Total — antes del procesamiento de tarjeta |
| Example row: driver total — *only if a card-only charge is itemised* | Total — card fare | Total — viaje con tarjeta |
| Stripe H2 | Card processing is Stripe’s, not YeRide’s | El procesamiento de tarjeta es de Stripe, no de YeRide |
| Stripe body | On card fares, Stripe charges its processing fee directly to the driver’s own account. YeRide never touches it and doesn’t set it. | En los viajes con tarjeta, Stripe le cobra su cargo de procesamiento directamente a la cuenta de quien maneja. YeRide nunca lo toca ni lo fija. |
| Stripe link → `https://stripe.com/pricing` | See Stripe’s pricing | Mira los precios de Stripe |
| Surge H2 | No surge today | Hoy no hay recargo por demanda |
| Surge body | There is no demand surcharge right now. If we ever add one, these rules hold: it will be published and capped, shown to you before you request a ride, and 100% of it goes to the driver. YeRide’s fees never change with demand. | Ahora mismo no hay recargo por demanda. Si algún día agregamos uno, estas reglas se cumplen: será publicado y con tope, se te muestra antes de pedir el viaje, y el 100% es para quien maneja. Los cargos de YeRide nunca cambian con la demanda. |
| Fetched stamp | Fetched live · {timestamp} | En vivo · {timestamp} |
| Loading | Loading current rates… | Cargando las tarifas actuales… |
| Error | We couldn’t load the current rates. Refresh, or [contact us](/contact). | No pudimos cargar las tarifas actuales. Recarga la página o [escríbenos](/contact). |
| Estimate link → `/fare-estimate` | Estimate a fare | Estima una tarifa |

**Formula-based charges** render as a plain-language rule from the endpoint's human-readable
form (e.g. "$0.10 per minute" / "$0.10 por minuto"), not as a fixed amount. If the endpoint
cannot produce a readable form for a charge, render the `description` and the rule it does
supply — never invent one. Per
[`research/fee-schedule-source.md`](https://github.com/yeapptech/yeride-website/blob/research/fee-schedule-source/research/fee-schedule-source.md),
the endpoint returns fields verbatim, so a broken document must be **visible** on this page,
not masked: a missing rate renders as an explicit gap, never as `$0.00`.

The example is computed client-side from the schedule just fetched. It must never be a
hard-coded number, and it must be labelled as an example on the same screen as the figures.

### 3.5 `/fare-estimate` and `/es/fare-estimate`

Keeps the Firebase callable `estimateFares` and the Google Maps loader.

> **Amended 2026-08-02 (#47) — the fee block is cut. Read this before building #38.**
>
> This section used to say the itemized `appCharges` the backend returns are **rendered**
> here. They must not be. **The rider does not pay them.**
>
> § 6 note 7 asked whether `fare` already includes `appChargesTotal`, or whether the total is
> additive. The answer is **neither**: `appChargesTotal` is not the rider's money in either
> payment flow (`yeride-functions lib/payments.js` L268–310). On card the rider is charged
> `priceFare` — the metered fare, nothing added — and `appChargesTotal` is taken from the
> **driver's** connected account as the application fee. On cash the rider pays the driver
> directly and YeRide then bills the **driver's** account for the same total.
>
> So what `/fare-estimate` shows a rider today — the fare alone — is already **correct and
> complete**. Rendering a breakdown of YeRide's charges beside it would tell a rider they pay
> something they do not: the same inversion § 3.4's ledger had, in rider-facing form.
>
> **Therefore: drop the "Fee block heading" row below.** Keep the limit note and the `/fees`
> link — that is where the charges belong, on the page that explains whose they are. If a
> rider-facing view of the driver's side is ever wanted, that is a new decision, not this row.
>
> **Amended again 2026-08-02 (#38), building it.** Two rows elsewhere still described the
> page the cut removed and are corrected with it: § 4's meta descriptions promised "with
> every fee itemized" / "con cada cargo detallado", and § 2.3 said the fee label map served
> this page as well as `/fees`. Neither is true. The claim is now nowhere on the site.

The page's tone stays as `docs/messaging.md` prescribes for fees: numbers, named lines, no
persuasion.

| Slot | EN | ES |
|---|---|---|
| H1 | Estimate a fare | Estima una tarifa |
| Lead | Where from, where to. We'll show what the ride would cost at today's rates. | De dónde a dónde. Te mostramos lo que costaría el viaje con las tarifas de hoy. |
| Pickup label | Pickup | Recogida |
| Pickup placeholder | Where are you starting? | ¿Dónde empiezas? |
| Dropoff label | Drop-off | Destino |
| Dropoff placeholder | Where are you going? | ¿A dónde vas? |
| Submit | Estimate the fare | Estimar la tarifa |
| Calculating | Working it out… | Calculando… |
| Route H2 | The route | La ruta |
| Distance | Distance | Distancia |
| Duration | Estimated time | Tiempo estimado |
| Results H2 | Available services | Servicios disponibles |
| Tier name and blurb **(added #65)** | *from § 2.3's ride tier map, keyed by `serviceId`* | *ídem* |
| Fare caption | estimated fare | tarifa estimada |
| Seats | {n} seats | {n} asientos |
| ~~Fee block heading~~ **(CUT — the rider does not pay these; see the amendment above)** | ~~Fees included~~ | ~~Cargos incluidos~~ |
| Priced-for label **(added #62)** | Priced for | Precio calculado para |
| Priced-for note **(added #62)** | Every estimate here uses this area's rates, even for a route outside it — a price is not a promise that YeRide operates there. | Todo estimado aquí usa las tarifas de esta área, incluso para una ruta fuera de ella — un precio no significa que YeRide opere allí. |
| Limit note | Estimates are estimates — the meter decides. | Un estimado es un estimado — el taxímetro decide. |
| Fee link → `/fees` | See the full fee schedule | Ver el tarifario completo |
| No route error | We couldn't find a route between those two places. | No encontramos una ruta entre esos dos lugares. |
| Service error | We couldn't get an estimate right now. Try again in a moment. | No pudimos calcular el estimado ahora. Intenta de nuevo en un momento. |
| Outside area **(SHIPPED by #73 — one honest trigger; see below)** | We're not in that area yet. | Todavía no estamos en esa zona. |

~~**The "Outside area" row is not shipped**~~ — **shipped 2026-08-09 by
[#73](https://github.com/yeapptech/yeride-website/issues/73)**, after waiting through #38
and #62 for a condition that honestly means it.

It was withheld because the page asked `estimateFares` for `us-fl-south-florida` on every
call and had no way to know where the rider was. `getFeeSchedule` now publishes each
area's circle ([yeride-functions#45](https://github.com/yeapptech/yeride-functions/issues/45),
deployed 2026-08-09), so the page resolves the rider's **pickup** against those circles and
the sentence has exactly one trigger.

**That trigger is narrower than "no match", and the narrowing is the point.** The row runs
only when **every** area published a usable circle and none of them contains the pickup. An
area whose circle is missing might well contain the rider, so while one is unreadable the
only true answer is *we cannot tell* — and the page falls back to the "Priced for" pair
below, exactly as it did before #73. A two-state version of this rule would put "We're not
in that area yet." on screen because an admin left a radius blank, which is the same class
of false sentence the row was withheld over in the first place. The unreachable-endpoint
case lands in that same fallback: the estimate must not acquire a third hard dependency.

It is still **not** mapped to `functions/not-found`, which means the requested area has no
services configured — a fault, not a geography — and mapping the line there would tell
every rider on the site they are somewhere YeRide does not serve, during an outage.

The **pickup** decides, matching how a ride is dispatched. A **drop-off** outside every
area is not an error: it is priced at the pickup area's rates, which is what the
"Priced-for note" below discloses.

> **Amended 2026-08-03 (#62) — the two "Priced-for" rows above are new, and they are
> what the page says instead.**
>
> #62 found that a service area is a **circle** and always has been: every
> `serviceAreas/{id}` document carries `latitude`, `longitude` and `radius` in metres
> (yeride-mobile's `ServiceAreaDoc`, typed by an admin in yeride-admin's
> `ServiceAreaEditSheet`), and yeride-mobile's `ResolveActiveServiceArea` already answers
> "is the rider inside?" with Haversine — first match in document-id order on overlap.
> `getFeeSchedule`'s `readAreas` **already reads those documents** and publishes only
> `{id, identifier}`, discarding the geography. So the site is not missing a model, it is
> missing a field: [yeapptech/yeride-functions#45](https://github.com/yeapptech/yeride-functions/issues/45).
>
> Until that lands the page cannot say *where the rider is*, but it can say **where the
> quote is from**, which is true today and needs no new data. The label carries the area
> name and the note carries the consequence.
>
> **Neither string may govern the area name.** It is interpolated from the same bilingual
> map `/fees` uses, and Spanish would need "de/del/de la" chosen by name — "en {area}" is
> ungrammatical for "Sur de la Florida". Hence a colon in the label and "this area" /
> "esta área" in the note: correct for any area name the map ever holds. For the same
> reason neither string may claim **how many** areas there are; a count would be a fact
> nothing on the site checks.
>
> This is a floor, not the fix. Resolving the area from the rider's pickup, and with it
> shipping the "Outside area" row above, is
> [#73](https://github.com/yeapptech/yeride-website/issues/73) — **done 2026-08-09**.
>
> **Both rows survive #73 unchanged, and the label is still shown when resolution
> succeeds.** The page prices one area; a rider looking at a map with their own route on
> it cannot tell which; and the two states that fall back to the default are invisible
> from the outside. Showing the disclosure only when the site could *not* resolve would
> make it appear exactly where the page was least certain and vanish where it was most —
> visible doubt, hidden confidence. The note also stays true in the resolved case, where
> "a route outside it" is now about the **drop-off**.

> **Corrected 2026-08-03, same day, by independent review — the first version of these
> two rows said "Service area" and did not mention availability. Both were wrong.**
>
> **The label is "Priced for", not "Service area".** "Service area" is this document's
> **coverage** vocabulary — § 3.4 line 427 labels `/fees`' picker `Service area` /
> `Área de servicio`, and § 3.7/§ 3.8 use it the same way in both legal documents. On a
> page that has just drawn the rider's own route, "Service area: South Florida" reads as
> *your ride is handled under our South Florida service area* — restating, in the site's
> own words, the exact implicature this ticket exists to remove. It also gave the Spanish
> site **two nouns for one concept** one click apart, since the page's own closing link
> goes to `/es/fees` and its picker says "Área de servicio". "Priced for" makes the
> pricing claim and no coverage claim, and cannot collide with § 3.4 because it is naming
> a different thing. Where the note does refer to the area it now says **"esta área"**,
> matching § 3.4 and both legal documents.
>
> **The note now carries availability.** The first version — *"Every estimate here is at
> this area's rates, even for a route outside it."* — named the rate card but told a
> rider nothing about whether YeRide runs where they are, and read closer to a *promise*
> that out-of-area routes get priced than to a warning. Naming the area a price came from
> is not an availability statement. The clause **"a price is not a promise that YeRide
> operates there"** is, and it stays true however many areas exist — unlike naming the
> served set, which the no-count rule above forbids for good reason.

The **gated headline copy does not run here** — no "See the math", no "Cuentas claras", no
claim that YeRide shows the math on every trip. The page shows a fare; it makes no claim
about fees, and now links to `/fees` for them.

**The § 2.3 label map is therefore not used on this page** — only `/fees` renders charge
lines. Note that #41's fee-label check should still cover every id the endpoint returns,
because `/fees` renders them.

Also drop the unused `firebase-admin` dependency (already in ticket #38).

### 3.6 `/about` and `/es/about`

| Slot | EN | ES |
|---|---|---|
| H1 | About YeRide | Sobre YeRide |
| Identity paragraph | Brand `docs/identity.md`, "Who we are" (EN), **less the origin sentence and the fee sentence** — the exact text is written out below. | The same section's **ES** paragraph, less the same two — written out below. |
| Mission H2 | Our mission | Nuestra misión |
| Mission | Make ridesharing fair: drivers keep what they earn, riders pay what the ride is worth. | Hacer justo el transporte compartido: que quien maneja se quede con lo que gana y quien viaja pague lo justo. |
| Values H2 | What we hold to | En qué nos sostenemos |
| Value 1 | Transparency — every fee flat, published, and visible. | Transparencia — cada cargo fijo, publicado y a la vista. |
| Value 2 | Fairness to both sides — never grow one side's number by squeezing the other. | Justicia para ambos lados — nunca subir el número de un lado apretando al otro. |
| Value 3 | Respect for the people doing the work — drivers are customers, not costs. | Respeto por quien hace el trabajo — quien maneja es cliente, no un costo. |
| Value 4 | Earn by efficiency, not extraction. | Ganar por eficiencia, no por extracción. |
| Entity line | YeRide is built by YeAPP TECH LLC, a Florida software company founded by Hernando Sierra. | YeRide es un producto de YeAPP TECH LLC, una empresa de software de la Florida fundada por Hernando Sierra. |

**The identity paragraph, exactly** *(amended 2026-08-10, #85)*. Both languages now exist in
brand `docs/identity.md` — [yeride-brand#22](https://github.com/yeapptech/yeride-brand/issues/22)
landed the authored ES paragraph in `fe5be01`, so the old block is lifted. Neither language can
be used **whole**, though, so this is the text, and the build ticket takes it from here rather
than from the brand doc:

**EN**

> **YeRide is a rideshare platform built in South Florida on a simple promise: drivers keep
> what they earn, and riders pay what the ride is worth.** YeRide takes no commission. The name
> says the rest: "ye" is the old word for *you*. YeRide is your ride — whichever seat you're in.
> YeRide is built by YeAPP TECH LLC, a Florida software company.

**ES**

> **YeRide es una plataforma de viajes hecha en el Sur de la Florida sobre una promesa
> sencilla: lo que el conductor gana es suyo, y el pasajero paga lo justo.** YeRide no cobra
> comisión. El nombre dice el resto: "ye" es el *you* del inglés antiguo — el "tú" que se le
> dice a todos. YeRide es tu viaje — vayas en el asiento que vayas. YeRide la construye
> YeAPP TECH LLC, una compañía de software de la Florida.

Every word above is the brand's, unedited and in its own order. What was done to it is
**omission only** — two spans are cut, and nothing is rewritten, resequenced or translated. The
brand doc says "Use each paragraph verbatim … Shorten from the top", and cutting from the middle
is neither, so this is a **deliberate deviation** recorded here rather than a reading of that
instruction. It is not a preference: § 5 fails the build on both omitted spans, in both
languages, and the reason it does is that they are **not true today**.

- **The fee sentence** — EN *"Drivers pay flat, published technology fees, plus trip insurance
  and card processing passed through at cost …"*, ES *"El conductor paga tarifas de tecnología
  fijas y publicadas, más el seguro del viaje y el procesamiento de tarjeta al costo …"* —
  states the suspended pass-through family as fact. YeRide **carries no insurance**, and card
  processing is not a YeRide pass-through at all: Stripe bills the driver's own connected
  account directly (§ 3.4, [#47](https://github.com/yeapptech/yeride-website/issues/47)). § 5
  gates every word it turns on — `insurance`/`seguro`, `at cost`/`al costo`, `passed through`.
  **Restore it when [#48](https://github.com/yeapptech/yeride-website/issues/48) lands**, which
  is the ticket that makes it true. The ES half needs a second look even then: *"tarifas de
  tecnología fijas"* is the construction
  [#75](https://github.com/yeapptech/yeride-website/issues/75) removed from this site — in
  Spanish a *tarifa* is a **fare**, so it reads as fixed **fares**, which is false whatever
  happens to #48. That one is a brand-side wording bug, not a gate artifact.
- **The origin sentence** — the Hernando Sierra / Uber-and-Lyft story — carries `$100 or $150`,
  and § 5 admits **no hard-coded money**, because every figure on this site is fetched live.
  This omission is the softer of the two and it is a **choice, not a forced move**: the figures
  are Uber's and Lyft's, not YeRide's, so nothing here is a price claim, and a
  `copy-gate-allow` pragma naming this section would be well within precedent — § 8's privacy
  and terms copy already carries reader-facing pragmas of exactly that shape. It is cut because
  the beat it carries is the one an About page can most afford to lose, and because a pragma
  buys a permanent hole in the one rule that keeps invented money off this site. **Revisit it
  with brand** if the origin story is wanted: a version without the two figures would need no
  pragma at all.

What survives carries three of the paragraph's five beats — the promise, the name and the
entity — plus the no-commission line, and reads as one paragraph without the other two. The
mission, values and entity rows below are unaffected: they are this document's own copy and
were never quoted from `identity.md`.

### 3.7 `/contact` and `/es/contact`

| Slot | EN | ES |
|---|---|---|
| H1 | Contact us | Contáctanos |
| Lead | Questions, problems, or something we got wrong — write to us. | Preguntas, problemas o algo que hicimos mal — escríbenos. |
| Email label | Email | Correo |
| Email value | support@yeride.com | support@yeride.com |
| Place label | Where we are | Dónde estamos |
| Place value | Built in South Florida. | Hecho en el Sur de la Florida. |

The page is these four slots and nothing else. **It carries no form.**

**Removed:** the "Response Time — Within 24 hours" block (an unbacked service promise) and
"Location — United States" (replaced by the brand's own South Florida line).

**Corrected:** the address was `support@yeride.app`; it is `support@yeride.com`.

**No form** *(amended 2026-08-06, #39; supersedes the Tally entry and cuts the "Form
heading" row, "Send us a message" / "Mándanos un mensaje")*. `/contact` embedded Tally form
`mJa5J7`, and this section used to require a **Spanish twin form** before the page could
ship. The form is dropped instead, for three reasons:

1. **Its questions were never in this document.** They lived inside Tally — the last
   user-facing copy on the site outside the repo, unreadable by both copy gates. This section
   specified a "Form heading" and stopped; § 2.2 by contrast authors every label and
   placeholder of the pre-registration form in both languages. The map had no authority over
   the words people actually answered.
2. **Tally has no runtime localisation**, so honouring § 0.2 meant a second form, authored in
   Spanish and hand-synced forever, and under § 0.1 that blocked `/contact` in **both**
   languages. An English form under Spanish chrome is the leak § 2.3 and § 3.5 were amended
   over.
3. It **deleted a named processor** from the privacy policy (§ 3.8), which is a simpler
   change than swapping vendors — a hosted alternative that keeps the markup in-repo was
   considered and rejected on the same ground: it still needs the legal edit, and buys only
   what an endpoint YeRide owns would buy without a processor at all.

`support@yeride.com` was already a live `mailto:` in both legal documents, so publishing it
here exposes nothing new, and yeride-mobile's store obligation is a reachable support **URL**
(§ 6), not a form.

**If structured intake is ever wanted**, it is a new ticket and it comes back here first:
§ 3.7 gains per-field EN/ES cells in the shape of § 2.2, and the form is built like
`PreRegistrationForm` against an endpoint YeRide owns — not as a third-party embed.

### 3.8 `/privacy-policy` and `/es/privacy-policy`

**Not specified here.** The policy this entry was written against was boilerplate dated
30 Sep 2024 that predated the fee structure, payment handling, and the location data the meter
uses. The decision was to **rewrite the English policy to match what YeRide actually does,
then translate it** — a legal-review task, not a copy-map entry. Tracked as its own ticket.

Its Payment paragraph holds § 5's **permitted cash exception** *(2026-08-10, #111)*: *"When a
rider pays cash, the fare passes from rider to driver in person"* and its ES twin describe
what YeRide would store in a case that cannot arise, which is not an offer of a payment
method. They are the only cash strings on the site the gates allow, and they are allowed by
`permits` rather than by a pragma — see § 5. **Rewording them will fail the build**, because
the permitted phrase is matched on its own words; change § 5's `permits` in the same commit.

Two strings are fixed now, and appear on **both** language versions:

| Slot | EN | ES |
|---|---|---|
| H1 | Privacy Policy | Política de privacidad |
| Governing-language note | The English version governs in the event of any conflict. | En caso de conflicto, prevalece la versión en inglés. |

Register for both legal pages is **formal**, not the site-wide informal *tú* — a deliberate
exception to § 0.2.

### 3.9 `/terms` and `/es/terms`

**New page.** The footer promised "Terms of Service" via a dead `#` link; the page now exists.
Content is authored under the same legal pass as § 3.8 and is not specified here.

**§ 4 "Paying" lost its cash half** *(2026-08-10, #111)*. It said *"You can pay by card or in
cash."* and now says *"You pay by card."* / *"Usted paga con tarjeta."*, and the block below it
dropped the sentence about cash being handed to the driver. This is the barred capability
stated as a **term of the agreement** rather than as marketing — the instance a reader would
most reasonably rely on — so it went with the marketing copy rather than being left for a
separate pass. The section states the one method the product implements instead of going
silent on how you pay, and `updated` moved with it; the privacy policy's date did not, being
untouched. Restore the cash half only with obligation #5.

**§ 7 "Risk on a ride" replaced a denial with the position as it stands** *(2026-08-15, #118)*.
It said *"YeRide does not provide insurance for rides, riders, drivers or vehicles."* / *"YeRide
no ofrece ningún seguro…"* — one flat sentence — and now states three things: the driver's own
duty to carry primary automobile insurance meeting Fla. Stat. § 627.748(7) while logged on and
during every ride; that YeRide **does not currently** maintain a policy of its own and does not
verify what a driver carries; and § 627.748(8)(a)2's own warning that the driver's personal
policy might provide no coverage in either state. The sentence about a ride being an arrangement
between rider and driver survives unchanged. Body copy is still not transcribed here, per the
paragraph above; what is recorded is the **shape** of the claim, because § 5 is written against
it and two things follow from the change.

**The first is a tense.** The denial was timeless and the replacement is dated — *"does not
**currently** maintain"*, *"no mantiene **actualmente**"*. That is the honest statement while
#48 is open and a **false** one the day it lands, so #48 no longer merely relaxes a gate: it
must rewrite this section. The old one-sentence denial would have needed the same rewrite, but a
reader could tell at a glance; a present-tense qualifier reads as durable and will not announce
itself. **The second is the count.** These sentences ship, and they are allowed by per-line
`copy-gate-allow` pragmas, so the dist gate carries hand-blessed entries keyed to exact
occurrence counts — `insurance` ×4 and `coverage` ×1 in EN, `seguro` ×4, `póliza` ×3 and
`cobertura` ×1 in ES. **Any edit to § 7 that adds or drops one of those words fails the deploy**,
and § 5 argues at length against exactly this arrangement in a legal document that gets edited;
see the note there before editing this section or extending the pattern.

| Slot | EN | ES |
|---|---|---|
| H1 | Terms of Service | Términos de servicio |
| Governing-language note | The English version governs in the event of any conflict. | En caso de conflicto, prevalece la versión en inglés. |

### 3.10 `/404` — single file, language switched client-side

GitHub Pages serves one root `404.html` for every missing path, so `/es/404` would never be
reached. One file renders English by default and switches to Spanish when
`location.pathname` starts with `/es/`.

| Slot | EN | ES |
|---|---|---|
| H1 | We can't find that page. | No encontramos esa página. |
| Sub | It may have moved, or the link may be wrong. | Puede que se haya movido o que el enlace esté mal. |
| Link → `/` | Home | Inicio |
| Link → `/fees` | Fees | Tarifas |
| Link → `/fare-estimate` | Fare estimate | Estimar tarifa |

Exempt from the route-parity check by name (§ 6).

### 3.11 `/redirect` — single file, language switched client-side

Bounces to the `yeride://register` deep link. Same path-based switch, English default.

| Slot | EN | ES |
|---|---|---|
| Body | Opening YeRide… | Abriendo YeRide… |
| Manual fallback | Not redirected? Open YeRide. | ¿No abrió? Abre YeRide. |

Exempt from the route-parity check by name (§ 6).

---

## 4. Titles and meta descriptions

`<title>` and `meta description` are copy and are specified here. OG/social images, sitemap,
structured data, and analytics remain out of scope for this ticket.

| Route | `<title>` | `meta description` |
|---|---|---|
| `/` | Your ride, fair and clear. \| YeRide | Rideshare built in South Florida. No commission, flat published fees, and a rate card anyone can read. |
| `/es/` | Tu viaje, justo y claro. \| YeRide | Transporte compartido hecho en el Sur de la Florida. Sin comisión, cargos fijos y publicados, y un tarifario que cualquiera puede leer. |
| `/drivers` | Keep what you earn. \| YeRide for drivers | No commission — YeRide's fees are flat, published, and never a percentage of the fare. Run YeRide alongside Uber and Lyft. |
| `/es/drivers` | Lo que ganas es tuyo. \| YeRide | Sin comisión — los cargos de YeRide son fijos, publicados y nunca un porcentaje de la tarifa. Usa YeRide junto a Uber y Lyft. |
| `/riders` | Pay what the ride is worth. \| YeRide for riders | Published rates — base, miles, minutes. The same math every trip, and every fee published. |
| `/es/riders` | Paga lo justo. \| YeRide | Tarifas publicadas — base, millas, minutos. Las mismas cuentas en cada viaje y cada cargo publicado. |
| `/fees` | The fee schedule \| YeRide | Every fee YeRide charges, with current amounts fetched live. |
| `/es/fees` | El tarifario \| YeRide | Cada cargo que cobra YeRide, con los montos actuales en vivo. |
| `/fare-estimate` | Estimate a fare \| YeRide | See what a ride would cost at today's published rates. Estimates are estimates — the meter decides. |
| `/es/fare-estimate` | Estimar tarifa \| YeRide | Mira lo que costaría un viaje con las tarifas publicadas de hoy. Un estimado es un estimado — el taxímetro decide. |
| `/about` | About YeRide \| YeRide | Why YeRide exists, who built it, and the four things it holds to. |
| `/es/about` | Sobre YeRide \| YeRide | Por qué existe YeRide, quién lo construyó y las cuatro cosas en las que se sostiene. |
| `/contact` | Contact us \| YeRide | Questions, problems, or something we got wrong — reach the team behind YeRide. |
| `/es/contact` | Contáctanos \| YeRide | Preguntas, problemas o algo que hicimos mal — escríbele al equipo de YeRide. |
| `/privacy-policy` | Privacy Policy \| YeRide | How YeRide collects, uses, and protects your personal data. |
| `/es/privacy-policy` | Política de privacidad \| YeRide | Cómo YeRide recopila, usa y protege tus datos personales. |
| `/terms` | Terms of Service \| YeRide | The terms that govern your use of YeRide. |
| `/es/terms` | Términos de servicio \| YeRide | Los términos que rigen tu uso de YeRide. |
| `/404` | Page not found \| YeRide | *(none)* |
| `/redirect` | Opening YeRide… | *(none)* |

Every page carries `hreflang` alternates for its EN/ES pair plus `x-default` → the EN route.

---

## 5. Gated and never-claimed strings

The copy-gate lint (#41) fails the build on any of these outside an explicitly allowlisted slot.

**Gated** — correct claims that must not run until positioning obligations 1–3 all ship:

- `See the math` · `Cuentas claras` · `see the math on every trip`
- any copy claiming a visible per-trip fee breakdown in the app

**Gated on YeRide having insurance coverage** *(added 2026-08-02, #47; tracked by #48)* —
there is no insurance today, and card processing is not a YeRide pass-through, so the
"passed through at cost" family has zero members. These must fail the build until #48 lands:

- `at cost` · `al costo` · `passes through` / `pass-through` · `zero markup` · `sin recargo`
- `insurance` · `coverage` · `seguro` / `seguros` · `aseguranza` · `póliza` · `cobertura`,
  wherever it claims YeRide carries or forwards coverage. **The gate matches all six as bare
  words**, and it always has — this list said `insurance` · `seguro` until #118, which is the
  under-listing this map warns about elsewhere and which stayed harmless only while no live
  string used the other four. Terms § 7 now uses five of the six.

**The terms no longer deny; they date.** *(2026-08-15, #118.)* § 3.9's § 7 said *"YeRide does
not provide insurance…"* and now says *"does not **currently** maintain a policy of its own"*
alongside the driver's § 627.748(7) duty and § 627.748(8)(a)2's coverage warning. The bar above
is unchanged and still reads *wherever it claims YeRide carries or forwards coverage* — a duty
imposed on the driver and a denial in the present tense are neither. What changed is that the
gate can no longer tell any of them apart, so the honest sentences ship on **eight per-line
`copy-gate-allow` pragmas** and five dist-gate entries keyed to exact counts.

**That is the arrangement the paragraph below argues against, and #118 took it knowingly.**
§ 3.8's cash exception is expressed as `permits` precisely because a pragma in a *shipping*
legal document leaves the dist gate holding a count that breaks on an unrelated edit and names
the wrong cause when it does — and terms § 7 is a shipping legal document. It was not made a
`permits` phrase because it **cannot** safely be one: withdrawal is over overlapping bytes, so
permitting *"does not currently maintain an automobile insurance policy of its own"* would
excuse those bytes **wherever they appear**, and every clause the fifth bound was added to stop
could then be built on that opening. The permitted-phrase mechanism excuses a sentence that is
safe in any context; these sentences are safe only in this one. So the fragility is real, is
accepted, and is bounded by the counts rather than by the wording — **a § 7 edit fails on
`main` after the merge, not on the pull request**, because the dist gate needs `npm ci` and does
not run in `checks.yml`. Retire the whole arrangement with #48, which must rewrite § 7 anyway.

Stripe's fee **can** still be described honestly — the driver pays it directly from their own
connected account — but never with a YeRide-published amount, since YeRide does not set it.

**Gated on the app being able to produce a cash trip** *(added 2026-08-10, #111; tracked by
[yeapptech/yeride-mobile#277](https://github.com/yeapptech/yeride-mobile/issues/277))* —
`docs/positioning.md` demoted differentiator #5 and put **cash in any form** on its "Never
claimed" list. `yeride-mobile` writes `type: 'card'` and nothing else, so cash is an unbuilt
roadmap capability. These must fail the build until #277 lands:

- `cash` · `efectivo`, **bare** — one pattern per language, so a wording nobody has yet
  written ("we accept cash", "aceptamos efectivo") fails too, rather than only the phrasings
  someone happened to use. The enumeration failure is this map's recurring one.

**Retire these with #277, not with
[yeride-brand#124](https://github.com/yeapptech/yeride-brand/issues/124).** The two are
different questions: brand#124 settles which brand document is right, #277 settles whether
the claim is *true*. `docs/messaging.md` still carries "Cash or card." in its Do column and
is canonical; `positioning.md` records that `messaging.md` is **stale against its own bar**,
**refuses to invent a precedence rule**, and directs that the disagreement be treated as a
bar until brand#124 lands. #111 acted on that stopgap rather than waiting, because the
disagreement is about which document to cite and not about whether the claim is false.

**The permitted exception — the privacy policy's Payment paragraph, both languages.** § 3.8
says *"When a rider pays cash, the fare passes from rider to driver in person"* / *"Cuando un
pasajero paga en efectivo, la tarifa va del pasajero al conductor en persona"*. That is a
**conditional describing what YeRide would store in a case that cannot arise**, not an offer
of a payment method, so the bar does not reach it. It is expressed as `permits` — §5's
withdrawal mechanism (#82) — and **not** as a per-line `copy-gate-allow` pragma, because the
build strips pragmas and that paragraph *ships*: a pragma would leave the dist gate needing a
hand-blessed entry keyed to an exact occurrence count inside a legal document that gets
edited, an entry that breaks on an unrelated privacy edit and names the wrong cause when it
does. These are §5's **second and third** permitted phrases, after "no surge today".

**Each permitted phrase carries the clause that follows, and that length is the safety
argument — it is not verbosity to be trimmed.** Withdrawal is over **overlapping bytes**, so
whatever the permitted phrase covers is excused *wherever it appears*. #111's first revision
permitted the fragment "a rider pays cash", and a two-axis review found the consequence from
both directions: **any** offer written on top of that opening escaped the bar entirely —
*"When a rider pays cash, the driver keeps every dollar of it."* passed the real gate green,
a payment-method claim shipping off a §5 this document then described as closed. Carrying
"…, the fare passes" / "…, la tarifa va" fits the permission to the one sentence it was
granted for. **Shortening either phrase fails named controls** (7 and 6 respectively).

That first revision also carried **four conjunction patterns** — card-or-cash, both orders,
both languages, with no `permits`, as an unexcusable second layer. **They are gone**, and the
reason is recorded so nobody re-adds them: with the permission narrowed to the sentence, the
bare word accuses every conjunction shape unexcused, so **no control can make a conjunction
the sole accuser**, and two of the four were already unreachable before the narrowing —
mutation-tested green when deleted. Every bound has a positive control; a pattern no control
can hold is padding that reads as coverage. `scripts/copy-gate-patterns.test.mjs` keeps the
conjunction sentences as controls, now accused by the bare word.

**One half of #111's removal no pattern can hold.** `/riders` also lost *"Pay how you actually
pay."* / *"Paga como pagas tú."* — the same payment-choice claim in other words, carrying no
cash word for a gate to match. It was struck on judgement, and it is human review at copy
time, like the three §5 rules named at the top of `scripts/copy-gate-patterns.mjs`.

**Never claimed** — these never run, gate or no gate:

- `locked` / upfront-price language · `no surprises`
- `tarifa` or `precio` + a settled-in-advance adjective — `fija` · `fijada` · `plana` ·
  `cerrada` · `garantizada` · `acordada` · `pactada` · `preestablecida` ·
  `predeterminada` (and the masculine forms with `precio`) — plus its EN mirror,
  `flat` / `fixed` / `guaranteed` with `fare` / `price` / `pricing` / `rate`
  *(added 2026-08-04, #75; twice widened the same day after review)*. Matched in **either
  word order**, and with the two words a few **words** apart rather than adjacent, since
  "la tarifa es fija" is the same claim as "tarifa fija". Never across a full stop.

  The gap is counted in **words, not characters**, and the EN one is deliberately **short
  (two words)**. Both facts are measured, not preferences. A sentence-wide EN gap fails the
  build on **four live, correct EN strings**, the canonical driver pillar among them
  ("Flat, published tech fees — never a percentage of the fare"); and in characters the
  claim and the correct copy are only 12 against 23 apart — "A flat, published price"
  versus § 4's own home meta, "flat published fees, and a rate card anyone can read".
  In words that is 1 against 4, which is a margin worth having. `rate` is in scope on the
  EN side because here "rates" names the **meter** ("Published rates — base, miles,
  minutes"), so "flat rate" is the claim, not innocent fee vocabulary.

  **`única` / `único` are adjacent-only**, alone among the adjectives: "tarifa única" is
  the flat-fare claim, but `única` is also the ordinary word for *only*, so at any gap it
  fires on "Tarifas en la única zona donde operamos." Catching the claim is not worth
  making that sentence unwritable. **EN `agreed` is excluded** and `acordada`/`pactada`
  are **not**: the Spanish denial uses the finite verb ("no se **pactan** de antemano"),
  never the participle, so there is no collision at any gap — while the English one reads
  "rates for the service area, and they are not **agreed** in advance", which collides at
  sentence scope and clears the word gap by three words, too thin for the one sentence the
  rule exists to protect. There is **no exemption for the qualified form** "tarifas de
  tecnología fijas" — under the vocabulary rule below a YeRide charge is a `cargo`, so
  that is the wrong noun too, not a safe variant of it.
- `no surge ever` / `nunca habrá recargo` (note: "no surge **today**" is permitted, § 3.4)
- `cheapest` / `lowest fees` / `más barato`
- any earnings dollar figure
- any invented per-trip price or earnings comparison against Uber or Lyft
- safety claims beyond Fla. Stat. § 627.748

**ES vocabulary rule — a YeRide charge is a `cargo`, never a `tarifa`** *(added 2026-08-04,
#75)*. English has two nouns where Spanish has one: `tarifa` is both the metered fare and a
charge, so a bare "tarifas fijas" reads as fixed **fares** on a metered service — and
`tarifa fija` is the taxi trade's own term for a flat, meter-free price in this market.
§ 3.4 already calls every YeRide charge a `cargo` ("Cada cargo que cobra YeRide", "Cargos
de tecnología de YeRide", "Otros cargos", "Cargo por cancelación"), and reserves `tarifa`
for the meter ("Tarifa mínima", "Tarifa del taxímetro", "de la tarifa"). Keeping the two
nouns apart is what keeps the claim honest; a qualifier bolted onto the wrong noun is not
a substitute for the right one.

The rule governs a **charge**, so it does not reach `tarifario` — the rate card itself,
which is what `/es/fees` is called (§ 3.4's H1, "El tarifario") and what § 1.1's nav item
`Tarifas` is the short form of, exactly as EN's `Fees` is the short form of "The fee
schedule". A rate card may be named for the rates it publishes; a single charge may not.

Rider pillar 2 ("Same math every trip." / "Las mismas cuentas en cada viaje.") is **not gated**
— it claims published rates, not fee breakdowns, and runs at launch on `/riders`.

---

## 6. Notes for the build tickets

1. **Route-parity check (#41)** skips `404` and `redirect` by name, with a comment saying they
   are single-file by design. Every other route must have its `/es/` twin.
2. **Fee-label check (#41)** fails on any charge `id` returned by `getFeeSchedule` that § 2.3
   doesn't cover — extended to **service area** ids by #47, and to **ride tier** ids by #65.
   All three are checked across every area the endpoint serves, not just the default one, and
   the tier ids cover `/fare-estimate` too: `estimateFares` reads the same `rideServices`
   documents.
3. ~~**`/es/about` is blocked** on the yeride-brand ES identity paragraph.~~ — **cleared
   2026-08-10 (#85).** [yeride-brand#22](https://github.com/yeapptech/yeride-brand/issues/22)
   landed the authored ES paragraph (`fe5be01`), so both languages exist. Neither is usable
   **whole**, though: each states the suspended pass-through family as fact and each carries
   hard-coded money, so § 5 fails the build on both. § 3.6 now writes out the exact text —
   the brand's own words, two spans omitted, nothing rewritten — and the build ticket takes
   it from there rather than from the brand doc. The fee sentence returns with
   [#48](https://github.com/yeapptech/yeride-website/issues/48).
4. **`/privacy-policy` and `/terms`** are blocked on the legal-rewrite ticket.
5. ~~**The ES Tally form** does not exist yet; `/es/contact` cannot ship without its id.~~ —
   **dissolved 2026-08-06 (#39).** There is no form on either contact page; § 3.7 records
   why. `/es/contact` shipped with its English twin, and `/es/support` joined the redirect
   block in `astro.config.mjs`.
6. ~~**Driver pillar-2 slot placement** is #43's decision, not this map's~~ — decided
   ([#43](https://github.com/yeapptech/yeride-website/issues/43)) and written into § 3.2:
   the slot sits between pillar 1 and pillar 3 on `/drivers` only, reserved at launch by a
   plain comment and nothing else. The home page and `/riders` reserve nothing.
7. ~~**Verify `fare` vs `appChargesTotal`**~~ — done 2026-08-02 (#47), and the answer killed
   the heading. `appChargesTotal` is **neither included in nor additive to** the rider's
   fare: it is the **driver's** cost in both payment flows. The rider is charged `priceFare`
   alone. "Fees included" is cut and the fee block with it — see § 3.5.
8. ~~**Charge ids in § 2.3 are unverified**~~ — done: read off production 2026-08-01 and
   corrected in § 2.3 (#47). None of the guessed ids existed.
