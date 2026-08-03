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
