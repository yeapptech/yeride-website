// /fees and /es/fees copy — VERBATIM from docs/copy-map.md §3.4 (wayfinder #34).
// Do not reword, re-case, or re-punctuate.
//
// The strings #40 authored ahead of the map were blessed and amended into §3.4
// on 2026-08-02 (#47), so they are no longer provisional. The unit and rule
// fragments — used to phrase rates in both languages from the endpoint's
// machine-readable forms — stay a build-side detail the map does not carry.
// `cardNote` is dead: §3.4 dropped its row when card processing became its own
// section, and nothing reads it. Left in place rather than removed here, since
// deleting another ticket's leftover is not this change's business.
//
// The page withholds things, and each withholding states its own cause (#47).
// One string covering every branch was how the live page came to say "until
// every published charge is described above" while every published charge was
// described above — a false reason is the same class of error as guessing a
// charge into a family, which this page refuses to do. Three causes, three
// strings; the first pass at this shipped two, which left the same bug alive on
// the surviving branch and is what the review of #47 caught:
//   - `exampleUnpublished` — the endpoint returned no example trip at all. This
//     is what production actually renders today: `getFeeSchedule` returns
//     `example: null` because `pickupBandwidthCharge` meters the time before a
//     ride starts, which a synthetic reference trip cannot know
//     (yeride-functions#21).
//   - `exampleIncomplete` — the endpoint published an example but left a priced
//     charge out of it. The likeliest branch once #21 ships, for the same reason
//     the example is null today.
//   - `exampleUnavailable` — the site's own gap: a charge it cannot classify.
//     The ledger claims the money reconciles, so it is withheld rather than
//     shown short. Renders for nobody today.
//   - `gapNote` — explains a charge whose amount column is empty because the
//     endpoint publishes no summarisable rule for it. Phrased around the missing
//     amount, never around the "—" that fills it: two charge labels carry em
//     dashes of their own. Conditional, so it disappears when #21 publishes one.

export type Lang = "en" | "es";

export const feesCopy = {
  en: {
    h1: "The fee schedule",
    // The pass-through clause was cut on 2026-08-01 (#47): insurance does not
    // exist yet (#48) and card processing is not YeRide's to pass through —
    // Stripe bills the driver's own connected account. Restore it when the
    // pass-through family has members again.
    lead: "Every fee YeRide charges. Current amounts, fetched live.",
    areaLabel: "Service area",
    rateCardH2: "The rate card",
    rateRows: {
      base: "Base",
      distance: "Per mile",
      time: "Per minute",
      minimum: "Minimum fare",
      cancellation: "Cancellation fee",
    },
    unitNote: "Metered per kilometer; the per-mile figure is an exact conversion.",
    family1H2: "YeRide tech fees",
    family1Lead:
      "Flat, per-trip, published. This is how YeRide earns — never a percentage of the fare.",
    // copy-gate-allow: pass-through family suspended — no charge is filed into it, so this never renders (#48)
    family2H2: "Passed through at cost — zero markup",
    // copy-gate-allow: pass-through family suspended — no charge is filed into it, so this never renders (#48)
    family2Lead: "Costs YeRide forwards without touching.",
    insuranceNote:
      // copy-gate-allow: pass-through family suspended — no charge is filed into it, so this never renders (#48)
      "The coverage Florida requires during a ride. The rider's share and the driver's share are separate, published lines.",
    cardNote:
      "The card networks' standard rate, borne by the driver on card fares. Cash fares have none.",
    // Unclassified charges. "YeRide", not "the platform": every other line on
    // this page owns the charge by name, and distancing language reads as
    // evasion on a page whose whole pitch is transparency (#47).
    otherFamilyH2: "Other charges",
    otherFamilyLead: "Charges YeRide publishes that this page doesn’t describe yet.",
    // Phrased around the empty amount, not the "—" that fills it: two charge
    // labels carry em dashes of their own ("Ride technology — to pickup"), so a
    // note explaining "a —" was false about most of the dashes on screen (#47
    // review).
    gapNote:
      "A charge with no amount shown is one YeRide hasn’t published a rule for that this page can state plainly.",
    exampleH2: "Example at today’s rates",
    exampleNote: "Computed from the schedule above, not a quote.",
    riderColH: "What the rider pays",
    driverColH: "What the driver keeps",
    exampleFare: "Metered fare",
    exampleFees: "YeRide tech fees",
    colTotal: "Total",
    driverTotalCard: "Total — card fare",
    // Stripe's fee is real, driver-borne and never itemised here, so the driver's
    // total would otherwise overstate take-home on a card fare (#47).
    driverTotalBeforeCard: "Total — before card processing",
    cashNotePre: "On a cash fare there’s no card processing — the driver keeps ",
    cashNotePost: ".",
    // withheld ledger — one string per cause, never one string for all of them
    exampleUnpublished: "YeRide hasn’t published an example trip for this area yet.",
    exampleIncomplete:
      "YeRide’s example trip leaves out one of the charges above, so it wouldn’t add up.",
    exampleUnavailable:
      "The example is unavailable until every published charge is described above.",
    // Named for what it is, and attributed (map owner, 2026-08-02). No figure:
    // YeRide neither sets nor controls Stripe's rate, and with standard Connect
    // accounts it is between the driver and Stripe — publishing one would assert
    // a third party's pricing and break copy-map §0.4.
    stripeH2: "Card processing is Stripe’s, not YeRide’s",
    stripeBody:
      "On card fares, Stripe charges its processing fee directly to the driver’s own account. YeRide never touches it and doesn’t set it. Cash fares have none.",
    stripeLink: "See Stripe’s pricing",
    surgeH2: "No surge today",
    surgeBody:
      "There is no demand surcharge right now. If we ever add one, these rules hold: it will be published and capped, shown to you before you request a ride, and 100% of it goes to the driver. YeRide’s fees never change with demand.",
    fetchedStamp: "Fetched live",
    loading: "Loading current rates…",
    errorPre: "We couldn’t load the current rates. Refresh, or ",
    errorLink: "contact us",
    errorPost: ".",
    estimateLink: "Estimate a fare",
    // addition — units and rule fragments
    miles: "miles",
    minutes: "minutes",
    perTrip: "per trip",
    perMinute: "per minute",
    perMile: "per mile",
    percentOfFare: "of the fare",
    locale: "en-US",
  },
  es: {
    h1: "El tarifario",
    lead: "Cada cargo que cobra YeRide. Montos actuales, en vivo.",
    areaLabel: "Área de servicio",
    rateCardH2: "El tarifario base",
    rateRows: {
      base: "Base",
      distance: "Por milla",
      time: "Por minuto",
      minimum: "Tarifa mínima",
      cancellation: "Cargo por cancelación",
    },
    unitNote: "Se mide por kilómetro; la cifra por milla es una conversión exacta.",
    family1H2: "Cargos de tecnología de YeRide",
    family1Lead:
      "Fijos, por viaje y publicados. Así gana YeRide — nunca un porcentaje de la tarifa.",
    // copy-gate-allow: pass-through family suspended — no charge is filed into it, so this never renders (#48)
    family2H2: "Trasladados al costo — sin recargo",
    // copy-gate-allow: pass-through family suspended — no charge is filed into it, so this never renders (#48)
    family2Lead: "Costos que YeRide traslada sin tocar.",
    insuranceNote:
      // copy-gate-allow: pass-through family suspended — no charge is filed into it, so this never renders (#48)
      "La cobertura que la Florida exige durante el viaje. La parte de quien viaja y la de quien maneja son líneas separadas y publicadas.",
    cardNote:
      "La tarifa estándar de las redes de tarjetas, que paga quien maneja en viajes con tarjeta. Los viajes en efectivo no la tienen.",
    otherFamilyH2: "Otros cargos",
    otherFamilyLead: "Cargos que YeRide publica y que esta página todavía no describe.",
    gapNote:
      "Un cargo sin monto es uno para el que YeRide todavía no publica una regla que esta página pueda expresar con claridad.",
    exampleH2: "Ejemplo con las tarifas de hoy",
    exampleNote: "Calculado con el tarifario de arriba; no es una cotización.",
    riderColH: "Lo que paga quien viaja",
    driverColH: "Lo que le queda a quien maneja",
    exampleFare: "Tarifa del taxímetro",
    exampleFees: "Cargos de tecnología de YeRide",
    colTotal: "Total",
    driverTotalCard: "Total — viaje con tarjeta",
    driverTotalBeforeCard: "Total — antes del procesamiento de tarjeta",
    cashNotePre:
      "En un viaje en efectivo no hay procesamiento de tarjeta — a quien maneja le quedan ",
    cashNotePost: ".",
    exampleUnpublished:
      "YeRide todavía no publica un viaje de ejemplo para esta área.",
    exampleIncomplete:
      "El viaje de ejemplo de YeRide deja fuera uno de los cargos de arriba, así que no cuadraría.",
    exampleUnavailable:
      "El ejemplo no está disponible hasta que cada cargo publicado esté descrito arriba.",
    stripeH2: "El procesamiento de tarjeta es de Stripe, no de YeRide",
    stripeBody:
      "En los viajes con tarjeta, Stripe le cobra su cargo de procesamiento directamente a la cuenta de quien maneja. YeRide nunca lo toca ni lo fija. Los viajes en efectivo no lo tienen.",
    stripeLink: "Mira los precios de Stripe",
    surgeH2: "Hoy no hay recargo por demanda",
    surgeBody:
      "Ahora mismo no hay recargo por demanda. Si algún día agregamos uno, estas reglas se cumplen: será publicado y con tope, se te muestra antes de pedir el viaje, y el 100% es para quien maneja. Los cargos de YeRide nunca cambian con la demanda.",
    fetchedStamp: "En vivo",
    loading: "Cargando las tarifas actuales…",
    errorPre: "No pudimos cargar las tarifas actuales. Recarga la página o ",
    errorLink: "escríbenos",
    errorPost: ".",
    estimateLink: "Estima una tarifa",
    miles: "millas",
    minutes: "minutos",
    perTrip: "por viaje",
    perMinute: "por minuto",
    perMile: "por milla",
    percentOfFare: "de la tarifa",
    locale: "es-US",
  },
} as const;

export type FeesCopy = (typeof feesCopy)[Lang];
