// ES labels for backend charge ids, keyed by id (copy-map §2.3), plus the
// editorial classification /fees needs. Charge lines arrive from the database as
// a single English `description`; Spanish is authored here, not translated by the
// backend.
//
// Beyond the label, each entry says which of the two `docs/positioning.md`
// families the charge belongs to and whose side of the example ledger it lands
// on — neither is a database field, and neither is something the endpoint can
// infer. Misfiling a charge would make a false claim about YeRide's economics,
// so an id this map doesn't cover is never guessed into a family (see /fees).
//
// VERIFIED against production 2026-08-01 (#47) — these are the ids
// `getFeeSchedule` actually returns, not the names positioning.md guessed, and
// `scripts/check-fee-labels.mjs` keeps them verified (#56): it asks the live
// endpoint, across every service area, and fails the deploy on an id this map
// misses. It runs daily too, because an id added upstream would otherwise sit
// unnoticed until the next release.
//
// `payer` is "driver" for all four, and that is not a guess: YeRide's charges
// come out of the driver's side in both payment flows (`yeride-functions
// lib/payments.js` L268–310). On card the rider is charged `priceFare` — the
// metered fare and nothing else — while `appChargesTotal` is taken from the
// driver's connected account as the application fee. On cash the rider pays the
// driver directly and YeRide then bills the driver's account for the same total.
//
// There are no pass-through charges. Insurance does not exist yet (#48), and
// card processing is not YeRide's to pass through — drivers are Stripe standard
// Connect accounts on direct charges, so Stripe bills their own account and the
// platform never touches it. The seeded `trip-insurance-*` and `card-processing`
// entries were removed for that reason; the `passthrough` family and `cardOnly`
// stay defined for when #48 gives them members again.

import type { Lang } from "./feesCopy";

export type ChargeFamily = "tech" | "passthrough";

export interface ChargeLabel {
  en: string;
  es: string;
  family: ChargeFamily;
  /** Whose money the charge comes out of. */
  payer: "rider" | "driver";
  /** Charges that exist only on card fares — dropped from the cash footnote. */
  cardOnly?: true;
}

export const feeLabels: Record<string, ChargeLabel> = {
  bookingCharge: {
    en: "Booking charge",
    es: "Cargo por reserva",
    family: "tech",
    payer: "driver",
  },
  dispatchCharge: {
    en: "Dispatch charge",
    es: "Cargo por despacho",
    family: "tech",
    payer: "driver",
  },
  // The two "bandwidth" charges are the technology YeRide provides the driver to
  // run a ride — directions, maps, tracking, payments — metered per minute over
  // the two legs. Named for what they are; the admin console still calls them
  // bandwidth (naming agreed with the map owner, 2026-08-02).
  pickupBandwidthCharge: {
    en: "Ride technology — to pickup",
    es: "Tecnología del viaje — hasta la recogida",
    family: "tech",
    payer: "driver",
  },
  dropoffBandwidthCharge: {
    en: "Ride technology — on trip",
    es: "Tecnología del viaje — en ruta",
    family: "tech",
    payer: "driver",
  },
};

// Service-area documents carry an `identifier` slug and no display-name field
// (yeride-admin-api docs/DATA-MODELS.md §serviceAreas). Display names stay the
// site's job by decision (#47, 2026-08-02) rather than moving to a backend
// `name` field: an area name is bilingual brand copy, not data, and a single
// backend string would ship one language and leak English onto /es/fees — the
// exact failure the charge-id rekey above was opened to fix. Two of the three
// servable stage areas are Spanish-speaking, so that is not hypothetical.
//
// The cost of keeping it here is that a new area needs a web deploy to launch
// with a real name. `scripts/check-fee-labels.mjs` makes that visible instead of
// silent (#56): it fails the deploy on an area id this map doesn't cover, the
// same treatment it gives an uncovered charge id. Without it an uncovered area
// falls back to its humanised identifier ("Us Mi Detroit") in both languages —
// which is what stage's two other areas do today.
export const serviceAreaNames: Record<string, Record<Lang, string>> = {
  "us-fl-south-florida": { en: "South Florida", es: "Sur de la Florida" },
};

export function serviceAreaName(id: string, identifier: string, lang: Lang): string {
  return (
    serviceAreaNames[id]?.[lang] ??
    identifier
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ")
  );
}

// Ride-tier display copy, keyed by the `rideServices/{id}` document id. Both
// languages are authored here, exactly as `feeLabels` above authors both for a
// charge — the backend's `name` and `description` are never rendered.
//
// THE TIERS ARE COPY, NOT BRAND NAMES (#65, decided with the map owner
// 2026-08-03). The reading that they are proper nouns is defensible — Uber
// keeps "Comfort" in Spanish-language markets — but nothing here backed it:
// `@yeapptech/yeride-brand` names no tier anywhere (messaging, positioning,
// brand-system, identity, logo), so there is no brand asset to protect, and
// copy-map §3.4 authors every other cell of the rate card in both languages.
// The tier column was a gap in that method, not an exception to it.
//
// AUTHORING EN TOO is the point, not incidental. Rendering the backend string
// on /fees and an authored one on /es/fees is what leaks English today; one map
// holding both keeps them from drifting apart, and keeps EN identical to what
// the app shows a rider, which is the one real cost of translating (both apps
// are English-only — yeride-mobile has no i18n at all and the legacy app on
// Play renders `Order {name} Service` — so a Spanish reader matches "Económico"
// here to "Economy" there; their docs call that temporary, "localization is a
// post-cutover concern").
//
// The EN strings are the operator's own, transcribed from production
// 2026-08-03, not rewritten — "SUVs Luxury ride" reads oddly and improving it is
// a copy-map question, not this map's. The Spanish is written to be natural
// rather than word-for-word.
//
// The cost is `serviceAreaNames`' cost: a tier renamed or added in the admin
// console needs a web deploy to appear. `scripts/check-fee-labels.mjs` makes an
// ADDED id loud (#56 extended by #65 — it fails on a service id this map does
// not cover, across every area). It cannot see an EDITED description, which is
// prose an operator may reword; that is the accepted trade for having the two
// languages agree at all.
export interface ServiceLabel {
  name: Record<Lang, string>;
  description: Record<Lang, string>;
}

export const serviceNames: Record<string, ServiceLabel> = {
  economy: {
    name: { en: "Economy", es: "Económico" },
    description: {
      en: "Affordable rides, compact cars",
      es: "Viajes accesibles, autos compactos",
    },
  },
  comfort: {
    name: { en: "Comfort", es: "Confort" },
    description: {
      en: "Standard sedans with more legroom",
      es: "Sedanes estándar con más espacio para las piernas",
    },
  },
  comfort_plus: {
    name: { en: "Comfort Plus", es: "Confort Plus" },
    description: { en: "SUVs or minivans", es: "SUV o minivans" },
  },
  luxury: {
    name: { en: "Luxury", es: "Lujo" },
    description: { en: "Luxury ride", es: "Viaje de lujo" },
  },
  // The separator really is a hyphen here where `comfort_plus` uses an
  // underscore. That is the admin console's inconsistency, not a typo — these
  // keys are document ids and must match it exactly.
  "luxury-plus": {
    name: { en: "Luxury Plus", es: "Lujo Plus" },
    description: { en: "SUVs Luxury ride", es: "SUV de lujo" },
  },
};

/**
 * A tier's display name, or the backend's own `name` for an id this map does
 * not cover.
 *
 * Falling back to the fetched string — rather than humanising the id the way
 * `serviceAreaName` must — is deliberate: a ride service document HAS a real
 * name field, so there is never a reason to invent one from `luxury-plus`
 * ("Luxury Plus" by luck, "Comfort Plus" only because the underscore happens to
 * split too). It is the same treatment /fees gives a charge id it cannot
 * classify: show what the backend calls it, verbatim, and never guess.
 *
 * The fallback leaks English onto /es until someone adds the key, which is why
 * #56 fails the deploy on it. Hiding the row instead would suppress a published
 * price on the page that exists to publish them.
 */
export function serviceName(id: string, fetched: string, lang: Lang): string {
  return serviceNames[id]?.name[lang] ?? fetched;
}

/** As `serviceName`, for the tier blurb /fare-estimate renders under it. */
export function serviceDescription(id: string, fetched: string, lang: Lang): string {
  return serviceNames[id]?.description[lang] ?? fetched;
}
