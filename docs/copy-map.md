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
| Password label | Password | Contraseña |
| Password placeholder | Create a password | Crea una contraseña |
| Confirm label | Confirm password | Confirma la contraseña |
| Confirm placeholder | Type it again | Escríbela otra vez |
| Submit | Pre-register | Pre-regístrate |
| Submitting | Sending… | Enviando… |

**Validation (client-side, shown per field):**

| Case | EN | ES |
|---|---|---|
| Required field empty | This one's required. | Este campo es obligatorio. |
| Email malformed | That doesn't look like an email address. | Ese correo no parece válido. |
| Phone malformed | Include the country code, like +1 305 555 0100. | Incluye el código de país, como +1 305 555 0100. |
| Password too short | Use at least 8 characters. | Usa al menos 8 caracteres. |
| Passwords differ | Those two don't match. | Las dos no coinciden. |

**Server outcomes — by failure class. The raw API string is logged, never displayed.**

| Class | EN | ES |
|---|---|---|
| Success | You're pre-registered. | Ya estás pre-registrado. |
| Email already registered | That email is already registered. | Ese correo ya está registrado. |
| Rejected input (4xx) | Check the details and try again. | Revisa los datos e intenta de nuevo. |
| Network / unreachable | We couldn't reach the server. Try again in a moment. | No pudimos conectar. Intenta de nuevo en un momento. |
| Anything else (5xx) | Something went wrong. Try again. | Algo salió mal. Intenta de nuevo. |

The success state renders the availability block (§ 2.1) beneath the success line, so the
person is told where the app actually is.

> **Flagged, decided against changing (2026-07-31):** this form POSTs to
> `${PUBLIC_API_URL}v1/auth/register` and creates a real production account, and Android is
> already live — so "pre-register" is a label the product has outgrown. Keeping the
> pre-registration framing was an explicit call. The copy above therefore never says
> "early access", "coming soon", or "when we launch": pairing the label with § 2.1 keeps
> the page truthful even though the label is loose.

### 2.3 Fee label map

Fee line names arrive from the database as a single `description` string per charge. The site
keeps an ES lookup keyed by the charge `id`, used by **both** `/fees` and `/fare-estimate`.

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
| Support left | No commission. Flat, published tech fees — never a percentage of the fare. | Sin comisión. Tarifas de tecnología fijas y publicadas — nunca un porcentaje de la tarifa. |
| Eyebrow, right | For riders | Para quien viaja |
| H2 right **(canonical)** | Pay what the ride is worth. | Paga lo justo. |
| Support right | Your fare goes to the person driving — not to a percentage cut. | Tu tarifa es para la persona que maneja — no para la comisión de una app. |

**Paper strip** — the facts, the limit, the fee link.

| Slot | EN | ES |
|---|---|---|
| Fact 1 | No commission. | Sin comisión. |
| Fact 2 | Flat, published fees. | Tarifas fijas y publicadas. |
| Fact 3 | Card or cash. | Tarjeta o efectivo. |
| Limit note | Estimates are estimates — the meter decides. | Un estimado es un estimado — el taxímetro decide. |
| Link → `/fees` | See the fee schedule | Ver el tarifario |

The home page carries **no pre-registration form**. Its job is the fork.

### 3.2 `/drivers` and `/es/drivers`

Pillars are the spine, in `docs/messaging.md` order. Driver pillar 2 is **gated and absent**;
its slot placement was decided in
[#43](https://github.com/yeapptech/yeride-website/issues/43) and is recorded below.

| Slot | EN | ES |
|---|---|---|
| Eyebrow | For drivers | Para quien maneja |
| H1 **(canonical, pillar 1)** | Keep what you earn. | Lo que ganas es tuyo. |
| Support | YeRide takes no commission. You pay flat, published tech fees — never a percentage of the fare. No subscriptions, no hidden fees. | YeRide no cobra comisión. Pagas tarifas de tecnología fijas y publicadas — nunca un porcentaje de la tarifa. Sin suscripciones, sin cargos escondidos. |
| *(gated pillar-2 slot — #43)* | — | — |
| H2 **(canonical, pillar 3)** | Trying costs nothing. | Probar no cuesta nada. |
| Support | Run YeRide alongside Uber and Lyft. You were driving anyway. | Usa YeRide junto a Uber y Lyft. Igual ya estabas manejando. |
| Fee pointer H3 | Flat, published fees. No commission. | Tarifas fijas y publicadas. Sin comisión. |
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
to fork, not to carry a pillar set. **/riders reserves nothing** — rider pillar 2 is ungated
(§ 5) and runs at launch in its natural position (§ 3.3). The two pages are symmetric in block
vocabulary — eyebrow, pillars, fee pointer, form, availability — not in section count; at
launch /riders runs one support couplet more, and that inverts once the driver gate lifts.

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
| Support line **(canonical, pillar 3 — never a headline)** | Card or cash. | Tarjeta o efectivo. |
| — its support | Pay how you actually pay. | Paga como pagas tú. |
| Fee pointer H3 | Every fee, published. | Cada cargo, publicado. |
| Fee pointer link → `/fees` | See the fee schedule | Ver el tarifario |
| Estimate link → `/fare-estimate` | Estimate a fare | Estima una tarifa |
| Form heading | Pre-register as a rider | Pre-regístrate para viajar |
| Form sub | Takes a minute. | Toma un minuto. |

Form `role` is pre-set to `rider`. Availability block (§ 2.1) sits beneath the form.
"Card or cash." runs as a support line, **never as a section headline** — `docs/messaging.md`
marks it supporting. Cleared to run by
[`research/cash-statute.md`](https://github.com/yeapptech/yeride-website/blob/research/cash-statute/research/cash-statute.md):
Fla. Stat. § 627.748 imposes no electronic-payment mandate.

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
> card-only charge is ever itemised; the cash note is conditional on the same thing, and
> renders for nobody today.
>
> **Three rows below were authored during #40**, not by this map, and have been live since
> 2026-08-01: **Other-charges H2 / lead**, the neutral panel an unclassifiable charge falls
> into rather than being guessed into a family; and **Example withheld**, shown instead of a
> short ledger when any charge is unclassified or has no amount in the example. They are
> recorded here so the map matches what ships — the map owner may still reword them.
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
| Other-charges lead | Charges the platform publishes that this page does not yet describe. | Cargos que publica la plataforma y que esta página todavía no describe. |
| Example H2 | Example at today’s rates | Ejemplo con las tarifas de hoy |
| Example note | Computed from the schedule above, not a quote. | Calculado con el tarifario de arriba; no es una cotización. |
| Example withheld | The example is unavailable until every published charge is described above. | El ejemplo no está disponible hasta que cada cargo publicado esté descrito arriba. |
| Example rider col H3 | What the rider pays | Lo que paga quien viaja |
| Example driver col H3 | What the driver keeps | Lo que le queda a quien maneja |
| Example row: fare | Metered fare | Tarifa del taxímetro |
| Example row: fees | YeRide tech fees | Cargos de tecnología de YeRide |
| Example row: rider total | Total | Total |
| Example row: driver total — **default** | Total — before card processing | Total — antes del procesamiento de tarjeta |
| Example row: driver total — *only if a card-only charge is itemised* | Total — card fare | Total — viaje con tarjeta |
| Example cash note **(conditional — renders only if a card-only charge is itemised; none is today)** | On a cash fare there’s no card processing — the driver keeps {amount}. | En un viaje en efectivo no hay procesamiento de tarjeta — a quien maneja le quedan {amount}. |
| Stripe H2 | Card processing is Stripe’s, not YeRide’s | El procesamiento de tarjeta es de Stripe, no de YeRide |
| Stripe body | On card fares, Stripe charges its processing fee directly to the driver’s own account. YeRide never touches it and doesn’t set it. Cash fares have none. | En los viajes con tarjeta, Stripe le cobra su cargo de procesamiento directamente a la cuenta de quien maneja. YeRide nunca lo toca ni lo fija. Los viajes en efectivo no lo tienen. |
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
| Fare caption | estimated fare | tarifa estimada |
| Seats | {n} seats | {n} asientos |
| ~~Fee block heading~~ **(CUT — the rider does not pay these; see the amendment above)** | ~~Fees included~~ | ~~Cargos incluidos~~ |
| Limit note | Estimates are estimates — the meter decides. | Un estimado es un estimado — el taxímetro decide. |
| Fee link → `/fees` | See the full fee schedule | Ver el tarifario completo |
| No route error | We couldn't find a route between those two places. | No encontramos una ruta entre esos dos lugares. |
| Service error | We couldn't get an estimate right now. Try again in a moment. | No pudimos calcular el estimado ahora. Intenta de nuevo en un momento. |
| Outside area | We're not in that area yet. | Todavía no estamos en esa zona. |

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
| Identity paragraph | **Verbatim** from brand `docs/identity.md`, "Who we are". Do not shorten except from the top. | **Blocked** — see below. |
| Mission H2 | Our mission | Nuestra misión |
| Mission | Make ridesharing fair: drivers keep what they earn, riders pay what the ride is worth. | Hacer justo el transporte compartido: que quien maneja se quede con lo que gana y quien viaja pague lo justo. |
| Values H2 | What we hold to | En qué nos sostenemos |
| Value 1 | Transparency — every fee flat, published, and visible. | Transparencia — cada cargo fijo, publicado y a la vista. |
| Value 2 | Fairness to both sides — never grow one side's number by squeezing the other. | Justicia para ambos lados — nunca subir el número de un lado apretando al otro. |
| Value 3 | Respect for the people doing the work — drivers are customers, not costs. | Respeto por quien hace el trabajo — quien maneja es cliente, no un costo. |
| Value 4 | Earn by efficiency, not extraction. | Ganar por eficiencia, no por extracción. |
| Entity line | YeRide is built by YeAPP TECH LLC, a Florida software company founded by Hernando Sierra. | YeRide es un producto de YeAPP TECH LLC, una empresa de software de la Florida fundada por Hernando Sierra. |

> **`/es/about` is blocked.** `docs/identity.md` carries the identity paragraph in **English
> only**, and `docs/messaging.md` requires canonical text to be *authored* in each language,
> not translated. An issue is filed against **yeride-brand** for an authored ES identity
> paragraph; `/es/about` consumes it verbatim when it lands. Do not improvise it here.

### 3.7 `/contact` and `/es/contact`

| Slot | EN | ES |
|---|---|---|
| H1 | Contact us | Contáctanos |
| Lead | Questions, problems, or something we got wrong — write to us. | Preguntas, problemas o algo que hicimos mal — escríbenos. |
| Email label | Email | Correo |
| Email value | support@yeride.com | support@yeride.com |
| Place label | Where we are | Dónde estamos |
| Place value | Built in South Florida. | Hecho en el Sur de la Florida. |
| Form heading | Send us a message | Mándanos un mensaje |

**Removed:** the "Response Time — Within 24 hours" block (an unbacked service promise) and
"Location — United States" (replaced by the brand's own South Florida line).

**Corrected:** the address was `support@yeride.app`; it is `support@yeride.com`.

**Tally:** `/contact` keeps form `mJa5J7`. `/es/contact` embeds a **Spanish twin form that does
not yet exist** — it must be created and its id recorded before the page ships. Fields mirror
the English form; question text is authored ES, not translated.

### 3.8 `/privacy-policy` and `/es/privacy-policy`

**Not specified here.** The current policy is boilerplate dated 30 Sep 2024 that predates the
fee structure, the cash option, and the location data the meter uses. The decision is to
**rewrite the English policy to match what YeRide actually does, then translate it** — a
legal-review task, not a copy-map entry. Tracked as its own ticket.

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
| `/es/` | Tu viaje, justo y claro. \| YeRide | Transporte compartido hecho en el Sur de la Florida. Sin comisión, tarifas fijas y publicadas, y un tarifario que cualquiera puede leer. |
| `/drivers` | Keep what you earn. \| YeRide for drivers | No commission — YeRide's fees are flat, published, and never a percentage of the fare. Run YeRide alongside Uber and Lyft. |
| `/es/drivers` | Lo que ganas es tuyo. \| YeRide | Sin comisión — los cargos de YeRide son fijos, publicados y nunca un porcentaje de la tarifa. Usa YeRide junto a Uber y Lyft. |
| `/riders` | Pay what the ride is worth. \| YeRide for riders | Published rates — base, miles, minutes. The same math every trip, and every fee published. Card or cash. |
| `/es/riders` | Paga lo justo. \| YeRide | Tarifas publicadas — base, millas, minutos. Las mismas cuentas en cada viaje y cada cargo publicado. Tarjeta o efectivo. |
| `/fees` | The fee schedule \| YeRide | Every fee YeRide charges, with current amounts fetched live. |
| `/es/fees` | El tarifario \| YeRide | Cada cargo que cobra YeRide, con los montos actuales en vivo. |
| `/fare-estimate` | Estimate a fare \| YeRide | See what a ride would cost at today's published rates, with every fee itemized. Estimates are estimates — the meter decides. |
| `/es/fare-estimate` | Estimar tarifa \| YeRide | Mira lo que costaría un viaje con las tarifas publicadas de hoy, con cada cargo detallado. Un estimado es un estimado — el taxímetro decide. |
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
- `insurance` · `seguro`, wherever it claims YeRide carries or forwards coverage

Stripe's fee **can** still be described honestly — the driver pays it directly from their own
connected account — but never with a YeRide-published amount, since YeRide does not set it.

**Never claimed** — these never run, gate or no gate:

- `locked` / upfront-price language · `no surprises`
- `no surge ever` / `nunca habrá recargo` (note: "no surge **today**" is permitted, § 3.4)
- `cheapest` / `lowest fees` / `más barato`
- any earnings dollar figure
- any invented per-trip price or earnings comparison against Uber or Lyft
- safety claims beyond Fla. Stat. § 627.748

Rider pillar 2 ("Same math every trip." / "Las mismas cuentas en cada viaje.") is **not gated**
— it claims published rates, not fee breakdowns, and runs at launch on `/riders`.

---

## 6. Notes for the build tickets

1. **Route-parity check (#41)** skips `404` and `redirect` by name, with a comment saying they
   are single-file by design. Every other route must have its `/es/` twin.
2. **Fee-label check (#41)** fails on any charge `id` returned by `getFeeSchedule` that § 2.3
   doesn't cover.
3. **`/es/about` is blocked** on the yeride-brand ES identity paragraph.
4. **`/privacy-policy` and `/terms`** are blocked on the legal-rewrite ticket.
5. **The ES Tally form** does not exist yet; `/es/contact` cannot ship without its id.
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
