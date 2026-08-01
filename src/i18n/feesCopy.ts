// /fees and /es/fees copy — VERBATIM from docs/copy-map.md §3.4 (wayfinder #34).
// Do not reword, re-case, or re-punctuate.
//
// Three groups are additions this build needed and the copy map does not yet
// carry; they are marked and flagged on #40:
//   - `otherFamilyH2` / `otherFamilyLead` — where a charge id the site can't
//     classify renders, since guessing it into either family would be a claim.
//   - `exampleUnavailable` — the ledger claims the money reconciles, so it is
//     withheld rather than shown incomplete when a charge is unclassified.
//   - the unit and rule fragments used to phrase rates and rules in both
//     languages from the endpoint's machine-readable forms.

export type Lang = "en" | "es";

export const feesCopy = {
  en: {
    h1: "The fee schedule",
    lead: "Every fee YeRide charges, and every cost it passes through. Current amounts, fetched live.",
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
    family2H2: "Passed through at cost — zero markup",
    family2Lead: "Costs YeRide forwards without touching.",
    insuranceNote:
      "The coverage Florida requires during a ride. The rider's share and the driver's share are separate, published lines.",
    cardNote:
      "The card networks' standard rate, borne by the driver on card fares. Cash fares have none.",
    // addition — unclassified charges
    otherFamilyH2: "Other charges",
    otherFamilyLead:
      "Charges the platform publishes that this page does not yet describe.",
    exampleH2: "Example at today’s rates",
    exampleNote: "Computed from the schedule above, not a quote.",
    riderColH: "What the rider pays",
    driverColH: "What the driver keeps",
    exampleFare: "Metered fare",
    exampleFees: "YeRide tech fees",
    colTotal: "Total",
    driverTotalCard: "Total — card fare",
    cashNotePre: "On a cash fare there’s no card processing — the driver keeps ",
    cashNotePost: ".",
    // addition — withheld ledger
    exampleUnavailable:
      "The example is unavailable until every published charge is described above.",
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
    lead: "Cada cargo que cobra YeRide y cada costo que traslada. Montos actuales, en vivo.",
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
    family2H2: "Trasladados al costo — sin recargo",
    family2Lead: "Costos que YeRide traslada sin tocar.",
    insuranceNote:
      "La cobertura que la Florida exige durante el viaje. La parte de quien viaja y la de quien maneja son líneas separadas y publicadas.",
    cardNote:
      "La tarifa estándar de las redes de tarjetas, que paga quien maneja en viajes con tarjeta. Los viajes en efectivo no la tienen.",
    otherFamilyH2: "Otros cargos",
    otherFamilyLead:
      "Cargos que publica la plataforma y que esta página todavía no describe.",
    exampleH2: "Ejemplo con las tarifas de hoy",
    exampleNote: "Calculado con el tarifario de arriba; no es una cotización.",
    riderColH: "Lo que paga quien viaja",
    driverColH: "Lo que le queda a quien maneja",
    exampleFare: "Tarifa del taxímetro",
    exampleFees: "Cargos de tecnología de YeRide",
    colTotal: "Total",
    driverTotalCard: "Total — viaje con tarjeta",
    cashNotePre:
      "En un viaje en efectivo no hay procesamiento de tarjeta — a quien maneja le quedan ",
    cashNotePost: ".",
    exampleUnavailable:
      "El ejemplo no está disponible hasta que cada cargo publicado esté descrito arriba.",
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
