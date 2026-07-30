// PROTOTYPE (wayfinder #33) — throwaway.
// Canonical lines are verbatim from yeride-brand docs/messaging.md and must not be
// reworded. Support lines are rephrased from the pillar support text (allowed —
// campaign copy may rephrase support, never the claims).
// Driver pillar 2 ("See the math" / "Cuentas claras") is GATED and deliberately absent.

export type Lang = 'en' | 'es';

export const copy = {
  en: {
    // — canonical, verbatim —
    tagline: 'Your ride, fair and clear.',
    driverOffer: 'Keep what you earn.',
    riderOffer: 'Pay what the ride is worth.',

    // — support —
    driverEyebrow: 'For drivers',
    riderEyebrow: 'For riders',
    driverSupport:
      'No commission. Flat, published tech fees — plus insurance and card processing at cost, zero markup.',
    riderSupport: 'Your fare goes to the person driving — not to a percentage cut.',
    driverCta: 'Drive with YeRide',
    riderCta: 'Ride with YeRide',

    ratesLine: 'Published rates — base, miles, minutes. The fare follows the ride.',
    feesBanner: 'Flat, published fees. No commission.',
    feesCta: 'See the fee schedule',

    facts: ['No commission.', 'Flat, published fees.', 'Card or cash.'],
    factsNote: 'Estimates are estimates — the meter decides.',

    nav: { fees: 'Fees', estimate: 'Fare estimate', about: 'About' },
    footerNote: 'Built in South Florida.',
  },
  es: {
    // — canónicas, textuales —
    tagline: 'Tu viaje, justo y claro.',
    driverOffer: 'Lo que ganas es tuyo.',
    riderOffer: 'Paga lo justo.',

    // — apoyo —
    driverEyebrow: 'Para quien maneja',
    riderEyebrow: 'Para quien viaja',
    driverSupport:
      'Sin comisión. Tarifas de tecnología fijas y publicadas — más el seguro y el procesamiento de tarjeta al costo, sin recargo.',
    riderSupport: 'Tu tarifa es para la persona que maneja — no para la comisión de una app.',
    driverCta: 'Maneja con YeRide',
    riderCta: 'Viaja con YeRide',

    ratesLine: 'Tarifas publicadas — base, millas, minutos. El precio sigue al viaje.',
    feesBanner: 'Tarifas fijas y publicadas. Sin comisión.',
    feesCta: 'Ver el tarifario',

    facts: ['Sin comisión.', 'Tarifas fijas y publicadas.', 'Tarjeta o efectivo.'],
    factsNote: 'Un estimado es un estimado — el taxímetro decide.',

    nav: { fees: 'Tarifas', estimate: 'Estimar tarifa', about: 'Nosotros' },
    footerNote: 'Hecho en el Sur de la Florida.',
  },
} as const;
