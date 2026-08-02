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
// `getFeeSchedule` actually returns, not the names positioning.md guessed. The
// build check (#41) fails on any id the endpoint returns that this map misses.
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
// (yeride-admin-api docs/DATA-MODELS.md §serviceAreas), so the picker's labels
// live here until the brand/admin side adds one. An area missing from this map
// falls back to its humanised identifier.
export const serviceAreaNames: Record<string, string> = {
  "us-fl-south-florida": "South Florida",
};

export function serviceAreaName(id: string, identifier: string): string {
  return (
    serviceAreaNames[id] ??
    identifier
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ")
  );
}
