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
// UNVERIFIED (copy-map §6.8): the ids below are the names positioning.md uses
// plus the rider/driver insurance split the #36 example ledger needs. They must
// be read off production and pruned; the build check (#41) fails on any id the
// endpoint returns that this map doesn't cover.

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
  "booking-fee": {
    en: "Booking fee",
    es: "Cargo por reserva",
    family: "tech",
    payer: "rider",
  },
  "dispatch-fee": {
    en: "Dispatch fee",
    es: "Cargo por despacho",
    family: "tech",
    payer: "rider",
  },
  "platform-fee": {
    en: "Platform fee",
    es: "Cargo de plataforma",
    family: "tech",
    payer: "rider",
  },
  "platform-minute-fee": {
    en: "Per-minute platform fee",
    es: "Cargo de plataforma por minuto",
    family: "tech",
    payer: "rider",
  },
  "trip-insurance-rider": {
    en: "Trip insurance — rider share",
    es: "Seguro del viaje — parte de quien viaja",
    family: "passthrough",
    payer: "rider",
  },
  "trip-insurance-driver": {
    en: "Trip insurance — driver share",
    es: "Seguro del viaje — parte de quien maneja",
    family: "passthrough",
    payer: "driver",
  },
  "card-processing": {
    en: "Card processing",
    es: "Procesamiento de tarjeta",
    family: "passthrough",
    payer: "driver",
    cardOnly: true,
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
