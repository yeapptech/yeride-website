// /drivers and /riders copy — VERBATIM from docs/copy-map.md §3.2 and §3.3
// (wayfinder #34). Do not reword, re-case, or re-punctuate. §4's title and meta
// description sit on the page files, as they do for /fees.
//
// H1s and H2s marked canonical in the copy map are `docs/messaging.md` pillar
// lines. Driver pillar 2 is gated (§5) and deliberately has NO key here — the
// slot is marked in DriversPage.astro by a comment and nothing else (#43), so
// no gated string enters src/ in any form.
import type { Lang } from "./feesCopy";

export const driversCopy = {
  en: {
    eyebrow: "For drivers",
    h1: "Keep what you earn.",
    support:
      "YeRide takes no commission. You pay flat, published tech fees — never a percentage of the fare. No subscriptions, no hidden fees.",
    pillar3H2: "Trying costs nothing.",
    pillar3Support:
      "Run YeRide alongside Uber and Lyft. You were driving anyway.",
    feeH3: "Flat, published fees. No commission.",
    feeLink: "See exactly what you pay",
    formHeading: "Pre-register as a driver",
    formSub: "Takes a minute.",
  },
  es: {
    eyebrow: "Para quien maneja",
    h1: "Lo que ganas es tuyo.",
    support:
      "YeRide no cobra comisión. Pagas cargos de tecnología fijos y publicados — nunca un porcentaje de la tarifa. Sin suscripciones, sin cargos escondidos.",
    pillar3H2: "Probar no cuesta nada.",
    pillar3Support:
      "Usa YeRide junto a Uber y Lyft. Igual ya estabas manejando.",
    feeH3: "Cargos fijos y publicados. Sin comisión.",
    feeLink: "Mira exactamente lo que pagas",
    formHeading: "Pre-regístrate para manejar",
    formSub: "Toma un minuto.",
  },
} satisfies Record<Lang, unknown>;

export const ridersCopy = {
  en: {
    eyebrow: "For riders",
    h1: "Pay what the ride is worth.",
    support:
      "Your fare goes to the person driving — not to a percentage cut.",
    pillar2H2: "Same math every trip.",
    pillar2Support:
      "Published rates — base, miles, minutes. The fare follows the ride, not what an app thinks you'll pay.",
    // Rider pillar 3 is GATED and absent, symmetric to driver pillar 2. It was
    // the couplet "Card or cash." / "Pay how you actually pay." — canonical in
    // docs/messaging.md, barred by docs/positioning.md until the app can produce
    // a cash trip (obligation #5, yeapptech/yeride-mobile#277). Both halves went,
    // not just the line: "Pay how you actually pay." is the same payment-choice
    // claim in other words, and it means nothing without a choice (wayfinder
    // #111). The slot is an insert when the gate lifts, not a redesign — see
    // docs/copy-map.md §3.3.
    feeH3: "Every fee, published.",
    feeLink: "See the fee schedule",
    estimateLink: "Estimate a fare",
    formHeading: "Pre-register as a rider",
    formSub: "Takes a minute.",
  },
  es: {
    eyebrow: "Para quien viaja",
    h1: "Paga lo justo.",
    support:
      "Tu tarifa es para la persona que maneja — no para la comisión de una app.",
    pillar2H2: "Las mismas cuentas en cada viaje.",
    pillar2Support:
      "Tarifas publicadas — base, millas, minutos. El precio sigue al viaje, no lo que la app cree que puedes pagar.",
    feeH3: "Cada cargo, publicado.",
    feeLink: "Ver el tarifario",
    estimateLink: "Estima una tarifa",
    formHeading: "Pre-regístrate para viajar",
    formSub: "Toma un minuto.",
  },
} satisfies Record<Lang, unknown>;
