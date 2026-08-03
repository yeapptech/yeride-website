// /fare-estimate and /es/fare-estimate copy — VERBATIM from docs/copy-map.md
// §3.5 (wayfinder #34), straight apostrophes and all: §3.5 writes them straight,
// as do §3.1–§3.3 and §2.2, and the pages built from them shipped that way.
// (Only /fees is curly, from its own §3.4 amendment.) Do not reword, re-case,
// or re-punctuate.
//
// WHAT IS NOT HERE, deliberately: the fee block. §3.5 used to have this page
// itemise the `appCharges` the estimate returns; that row was CUT (copy-map
// `8b66cfe`, #47) once `yeride-functions lib/payments.js` was read. Those
// charges are the DRIVER's cost in both payment flows — on card the rider is
// charged `priceFare` and nothing more, on cash the rider pays the driver and
// YeRide bills the driver after. Listing them beside a rider's fare would tell
// a rider they pay money they do not. The fare alone is the rider's whole
// number; `feeLink` is how this page points at the charges instead.
//
// There is therefore no §2.3 label map here — only /fees renders charge lines.

import type { Lang } from "./feesCopy";

const en = {
  h1: "Estimate a fare",
  lead: "Where from, where to. We'll show what the ride would cost at today's rates.",
  pickupLabel: "Pickup",
  pickupPlaceholder: "Where are you starting?",
  dropoffLabel: "Drop-off",
  dropoffPlaceholder: "Where are you going?",
  submit: "Estimate the fare",
  calculating: "Working it out…",
  routeH2: "The route",
  distance: "Distance",
  duration: "Estimated time",
  resultsH2: "Available services",
  fareCaption: "estimated fare",
  /** "{n} seats" — §3.5 gives the row with the placeholder in it. */
  seats: "{n} seats",
  limitNote: "Estimates are estimates — the meter decides.",
  /**
   * §3.5, amended by #62. The page prices ONE area whatever the rider typed,
   * so it says which — the label carries the area name, the note carries the
   * consequence.
   *
   * NOT "Service area" (the first attempt, corrected by review). That is the
   * site's COVERAGE vocabulary — `/es/fees` labels its picker "Área de
   * servicio" and both legal documents use it in that sense — so on a page
   * that has just drawn the rider's own route, "Service area: South Florida"
   * reads as *your ride is handled under our South Florida service area*: the
   * exact implicature this ticket exists to remove, restated in the site's own
   * words. "Priced for" makes the pricing claim and no coverage claim, and it
   * cannot collide with `/fees`, which is naming a different thing.
   *
   * The note then has to carry availability, because nothing else on the page
   * does: naming the area a price came from does not tell a rider YeRide is
   * absent where they are. It says a price is not a promise of service rather
   * than naming the served set, because the served set is a COUNT — it would
   * be false the day an area is added and nothing on the site checks it.
   *
   * The name is interpolated, so neither string may govern it: Spanish would
   * need "de/del/de la" by name and "en {area}" is ungrammatical for "Sur de
   * la Florida". A colon in the label and "this area" in the note keep both
   * languages correct for any area name the map ever holds.
   */
  areaLabel: "Priced for",
  areaNote:
    "Every estimate here uses this area's rates, even for a route outside it — a price is not a promise that YeRide operates there.",
  feeLink: "See the full fee schedule",
  noRouteError: "We couldn't find a route between those two places.",
  serviceError: "We couldn't get an estimate right now. Try again in a moment.",
  // §3.5's third error row, "Outside area" / "We're not in that area yet.", is
  // NOT here. The page asks `estimateFares` for `us-fl-south-florida` on every
  // call and has no way to know where the rider is, so nothing it can observe
  // means "you are outside our area" — `functions/not-found` means South
  // Florida itself has no services configured. Shipping the string would put a
  // sentence on screen the site cannot know to be true.
  //
  // #62 settled WHY the site cannot know: a service area is a circle
  // (`latitude`/`longitude`/`radius` on every `serviceAreas/{id}` document, and
  // yeride-mobile's `ResolveActiveServiceArea` already tests it with Haversine),
  // but `getFeeSchedule` publishes only `{id, identifier}`. Until
  // yeapptech/yeride-functions#45 publishes the circle, no condition on this
  // page means "you are outside our area" — so #62 shipped what IS true, the
  // `areaLabel`/`areaNote` pair ABOVE, and the row itself waits for #73.
};

export const fareEstimateCopy: Record<Lang, typeof en> = {
  en,
  es: {
    h1: "Estima una tarifa",
    lead: "De dónde a dónde. Te mostramos lo que costaría el viaje con las tarifas de hoy.",
    pickupLabel: "Recogida",
    pickupPlaceholder: "¿Dónde empiezas?",
    dropoffLabel: "Destino",
    dropoffPlaceholder: "¿A dónde vas?",
    submit: "Estimar la tarifa",
    calculating: "Calculando…",
    routeH2: "La ruta",
    distance: "Distancia",
    duration: "Tiempo estimado",
    resultsH2: "Servicios disponibles",
    fareCaption: "tarifa estimada",
    seats: "{n} asientos",
    limitNote: "Un estimado es un estimado — el taxímetro decide.",
    areaLabel: "Precio calculado para",
    // "esta área", not "esta zona": `/es/fees` already says "para esta área"
    // (feesCopy.ts) and both legal documents say "área de servicio", so a new
    // "zona" would give the Spanish site two words for one thing, one click
    // apart — the leak #47 kept these names site-side to prevent.
    areaNote:
      "Todo estimado aquí usa las tarifas de esta área, incluso para una ruta fuera de ella — un precio no significa que YeRide opere allí.",
    feeLink: "Ver el tarifario completo",
    noRouteError: "No encontramos una ruta entre esos dos lugares.",
    serviceError: "No pudimos calcular el estimado ahora. Intenta de nuevo en un momento.",
  },
};
