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
  feeLink: "See the full fee schedule",
  noRouteError: "We couldn't find a route between those two places.",
  serviceError: "We couldn't get an estimate right now. Try again in a moment.",
  // §3.5's third error row, "Outside area" / "We're not in that area yet.", is
  // NOT here. The page asks `estimateFares` for `us-fl-south-florida` on every
  // call and has no way to know where the rider is, so nothing it can observe
  // means "you are outside our area" — `functions/not-found` means South
  // Florida itself has no services configured. Shipping the string would put a
  // sentence on screen the site cannot know to be true. Filed as #62; it
  // returns when the site can answer the question the copy asks.
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
    feeLink: "Ver el tarifario completo",
    noRouteError: "No encontramos una ruta entre esos dos lugares.",
    serviceError: "No pudimos calcular el estimado ahora. Intenta de nuevo en un momento.",
  },
};
