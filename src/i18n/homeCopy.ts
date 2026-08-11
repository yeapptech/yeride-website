// / and /es/ copy — VERBATIM from docs/copy-map.md §3.1 (wayfinder #34).
// Do not reword, re-case, or re-punctuate. §4's title and meta description sit
// on the page files, as they do for /fees.
//
// The H1s and the two Ink-band H2s are canonical `docs/messaging.md` lines.
//
// The Paper strip runs TWO facts, not three. Fact 3 was "Card or cash." /
// "Tarjeta o efectivo." — canonical in `docs/messaging.md` and barred by
// `docs/positioning.md`, which demoted differentiator #5 and put cash in any
// form on its "Never claimed" list until the app can produce a cash trip
// (obligation #5, `yeapptech/yeride-mobile#277`). The two documents disagree
// and positioning refuses to rank them, directing that the disagreement be
// treated as a bar until yeapptech/yeride-brand#124 lands (wayfinder #111).
// Do not author a third fact to fill the gap: canonical copy comes from
// `messaging.md`, which is the stale document being rewritten. §5 now fails
// the build on the strings, so restoring one is a red build, not a silent edit.
import type { Lang } from "./feesCopy";

export const homeCopy = {
  en: {
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
    facts: ["No commission.", "Flat, published fees."],
    limitNote: "Estimates are estimates — the meter decides.",
    feesLink: "See the fee schedule",
  },
  es: {
    h1: "Tu viaje, justo y claro.",
    sub: "Tarifas publicadas — base, millas, minutos. El precio sigue al viaje.",
    driverCta: "Maneja con YeRide",
    riderCta: "Viaja con YeRide",
    driverEyebrow: "Para quien maneja",
    driverH2: "Lo que ganas es tuyo.",
    driverSupport:
      "Sin comisión. Cargos de tecnología fijos y publicados — nunca un porcentaje de la tarifa.",
    riderEyebrow: "Para quien viaja",
    riderH2: "Paga lo justo.",
    riderSupport:
      "Tu tarifa es para la persona que maneja — no para la comisión de una app.",
    facts: ["Sin comisión.", "Cargos fijos y publicados."],
    limitNote: "Un estimado es un estimado — el taxímetro decide.",
    feesLink: "Ver el tarifario",
  },
} satisfies Record<Lang, unknown>;
