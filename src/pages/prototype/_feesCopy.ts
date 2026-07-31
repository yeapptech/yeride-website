// PROTOTYPE (wayfinder #36) — throwaway.
// Page copy is VERBATIM from docs/copy-map.md § 3.4 (branch copy-map/en-es) and must
// not be reworded. ES charge labels are the site-side map keyed by charge id that
// § 2 prescribes for /fees and /fare-estimate.
//
// MOCK DATA: production hard-codes nothing — /fees fetches the schedule at runtime
// (research/fee-schedule-source.md). The amounts below are plausible stand-ins so the
// comp can be judged with real-looking density. Shape mirrors the recommended
// getFeeSchedule response: per-tier rate docs (per KM — miles are display math) plus
// app-charge docs rendered as plain-language rules, split into the two
// positioning.md families.

export type Lang = 'en' | 'es';

export const feesCopy = {
  en: {
    h1: 'The fee schedule',
    lead: 'Every fee YeRide charges, and every cost it passes through. Current amounts, fetched live.',
    rateCardH2: 'The rate card',
    rateRows: { base: 'Base', distance: 'Per mile', time: 'Per minute', minimum: 'Minimum fare' },
    unitNote: 'Metered per kilometer; the per-mile figure is an exact conversion.',
    family1H2: 'YeRide tech fees',
    family1Lead: 'Flat, per-trip, published. This is how YeRide earns — never a percentage of the fare.',
    family2H2: 'Passed through at cost — zero markup',
    family2Lead: 'Costs YeRide forwards without touching.',
    insuranceNote:
      "The coverage Florida requires during a ride. The rider's share and the driver's share are separate, published lines.",
    cardNote:
      "The card networks' standard rate, borne by the driver on card fares. Cash fares have none.",
    exampleH2: 'Example at today’s rates',
    exampleNote: 'Computed from the schedule above, not a quote.',
    surgeH2: 'No surge today',
    surgeBody:
      'There is no demand surcharge right now. If we ever add one, these rules hold: it will be published and capped, shown to you before you request a ride, and 100% of it goes to the driver. YeRide’s fees never change with demand.',
    fetchedStamp: 'Fetched live',
    loading: 'Loading current rates…',
    errorPre: 'We couldn’t load the current rates. Refresh, or ',
    errorLink: 'contact us',
    errorPost: '.',
    estimateLink: 'Estimate a fare',
    timestamp: '2:41 PM · Jul 31, 2026',
    exampleTrip: '5 miles · 15 minutes · Standard',
    exampleFare: 'Metered fare',
    exampleFees: 'YeRide tech fees',
    exampleInsurance: 'Trip insurance — rider share',
    exampleTotal: 'Example total',
  },
  es: {
    h1: 'El tarifario',
    lead: 'Cada cargo que cobra YeRide y cada costo que traslada. Montos actuales, en vivo.',
    rateCardH2: 'El tarifario base',
    rateRows: { base: 'Base', distance: 'Por milla', time: 'Por minuto', minimum: 'Tarifa mínima' },
    unitNote: 'Se mide por kilómetro; la cifra por milla es una conversión exacta.',
    family1H2: 'Cargos de tecnología de YeRide',
    family1Lead: 'Fijos, por viaje y publicados. Así gana YeRide — nunca un porcentaje de la tarifa.',
    family2H2: 'Trasladados al costo — sin recargo',
    family2Lead: 'Costos que YeRide traslada sin tocar.',
    insuranceNote:
      'La cobertura que la Florida exige durante el viaje. La parte de quien viaja y la de quien maneja son líneas separadas y publicadas.',
    cardNote:
      'La tarifa estándar de las redes de tarjetas, que paga quien maneja en viajes con tarjeta. Los viajes en efectivo no la tienen.',
    exampleH2: 'Ejemplo con las tarifas de hoy',
    exampleNote: 'Calculado con el tarifario de arriba; no es una cotización.',
    surgeH2: 'Hoy no hay recargo por demanda',
    surgeBody:
      'Ahora mismo no hay recargo por demanda. Si algún día agregamos uno, estas reglas se cumplen: será publicado y con tope, se te muestra antes de pedir el viaje, y el 100% es para quien maneja. Los cargos de YeRide nunca cambian con la demanda.',
    fetchedStamp: 'En vivo',
    loading: 'Cargando las tarifas actuales…',
    errorPre: 'No pudimos cargar las tarifas actuales. Recarga la página o ',
    errorLink: 'escríbenos',
    errorPost: '.',
    estimateLink: 'Estima una tarifa',
    timestamp: '2:41 p. m. · 31 jul 2026',
    exampleTrip: '5 millas · 15 minutos · Standard',
    exampleFare: 'Tarifa del taxímetro',
    exampleFees: 'Cargos de tecnología de YeRide',
    exampleInsurance: 'Seguro del viaje — parte de quien viaja',
    exampleTotal: 'Total del ejemplo',
  },
} as const;

// ---- mock schedule (shape of the recommended getFeeSchedule response) ----

const KM_PER_MILE = 1.609344;

export const tiers = [
  { id: 'standard', name: 'Standard', baseFare: 2.5, costPerKm: 1.12, costPerMinute: 0.3, minimumFare: 8 },
  { id: 'xl', name: 'XL', baseFare: 3.75, costPerKm: 1.71, costPerMinute: 0.45, minimumFare: 12 },
] as const;

export const perMile = (costPerKm: number) => costPerKm * KM_PER_MILE;
export const usd = (n: number) => `$${n.toFixed(2)}`;

// App charges render as plain-language rules, never invented fixed amounts.
export type Charge = { id: string; rule: { en: string; es: string } };
export const techFees: Charge[] = [
  { id: 'booking-fee', rule: { en: '$1.50 per trip', es: '$1.50 por viaje' } },
  { id: 'dispatch-fee', rule: { en: '$0.75 per trip', es: '$0.75 por viaje' } },
  { id: 'platform-minute-fee', rule: { en: '$0.10 per minute', es: '$0.10 por minuto' } },
];
export const passThroughs: Charge[] = [
  { id: 'trip-insurance-rider', rule: { en: '$0.90 per trip', es: '$0.90 por viaje' } },
  { id: 'trip-insurance-driver', rule: { en: '$1.35 per trip', es: '$1.35 por viaje' } },
  { id: 'card-processing', rule: { en: '2.9% + $0.30 per card fare', es: '2.9% + $0.30 por viaje con tarjeta' } },
];

// The site-side ES label map keyed by charge id (copy-map § 2); EN labels stand in
// for the endpoint's `description` field.
export const chargeLabels: Record<string, { en: string; es: string }> = {
  'booking-fee': { en: 'Booking fee', es: 'Cargo por reserva' },
  'dispatch-fee': { en: 'Dispatch fee', es: 'Cargo de despacho' },
  'platform-minute-fee': { en: 'Per-minute platform fee', es: 'Cargo de plataforma por minuto' },
  'trip-insurance-rider': { en: 'Trip insurance — rider share', es: 'Seguro del viaje — parte de quien viaja' },
  'trip-insurance-driver': { en: 'Trip insurance — driver share', es: 'Seguro del viaje — parte de quien maneja' },
  'card-processing': { en: 'Card processing', es: 'Procesamiento de tarjeta' },
};

// Example trip: 5 mi / 15 min on Standard. Production computes this CLIENT-SIDE from
// the schedule it just fetched; here it's precomputed from the mock for the comp.
const t0 = tiers[0];
const exMeters = 5 * KM_PER_MILE * 1000;
const exMinutes = 15;
export const example = {
  fare: Math.max(t0.baseFare + (exMeters / 1000) * t0.costPerKm + exMinutes * t0.costPerMinute, t0.minimumFare),
  fees: 1.5 + 0.75 + 0.1 * exMinutes,
  insurance: 0.9,
};
export const exampleTotal = example.fare + example.fees + example.insurance;
