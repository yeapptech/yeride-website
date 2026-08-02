// / and /es/ copy — VERBATIM from docs/copy-map.md §3.1, titles from §4
// (wayfinder #34). Do not reword, re-case, or re-punctuate.
//
// The H1s and the two Ink-band H2s are canonical `docs/messaging.md` lines.
import type { Lang } from "./feesCopy";

export const homeCopy = {
  en: {
    title: "Your ride, fair and clear. | YeRide",
    description:
      "Rideshare built in South Florida. No commission, flat published fees, and a rate card anyone can read.",
    h1: "Your ride, fair and clear.",
    sub: "Published rates — base, miles, minutes. The fare follows the ride.",
    driverCta: "Drive with YeRide",
    riderCta: "Ride with YeRide",
    driverEyebrow: "For drivers",
    driverH2: "Keep what you earn.",
    driverSupport:
      "No commission. Flat, published tech fees — never a percentage of the fare.",
    riderEyebrow: "For riders",
    riderH2: "Pay what the ride is worth.",
    riderSupport:
      "Your fare goes to the person driving — not to a percentage cut.",
    facts: ["No commission.", "Flat, published fees.", "Card or cash."],
    limitNote: "Estimates are estimates — the meter decides.",
    feesLink: "See the fee schedule",
  },
  es: {
    title: "Tu viaje, justo y claro. | YeRide",
    description:
      "Transporte compartido hecho en el Sur de la Florida. Sin comisión, tarifas fijas y publicadas, y un tarifario que cualquiera puede leer.",
    h1: "Tu viaje, justo y claro.",
    sub: "Tarifas publicadas — base, millas, minutos. El precio sigue al viaje.",
    driverCta: "Maneja con YeRide",
    riderCta: "Viaja con YeRide",
    driverEyebrow: "Para quien maneja",
    driverH2: "Lo que ganas es tuyo.",
    driverSupport:
      "Sin comisión. Tarifas de tecnología fijas y publicadas — nunca un porcentaje de la tarifa.",
    riderEyebrow: "Para quien viaja",
    riderH2: "Paga lo justo.",
    riderSupport:
      "Tu tarifa es para la persona que maneja — no para la comisión de una app.",
    facts: ["Sin comisión.", "Tarifas fijas y publicadas.", "Tarjeta o efectivo."],
    limitNote: "Un estimado es un estimado — el taxímetro decide.",
    feesLink: "Ver el tarifario",
  },
} satisfies Record<Lang, unknown>;
