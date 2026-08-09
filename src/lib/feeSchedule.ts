// The live fee schedule behind /fees (wayfinder #40).
//
// Amounts are never hard-coded (copy-map §0.4): the page fetches them at runtime
// from `getFeeSchedule`, a public read-only endpoint in yeride-functions. The
// response shape below is the pinned contract — it mirrors the Firestore
// documents verbatim (`serviceAreas/{areaId}/rideServices` and `/appCharges`,
// per research/fee-schedule-source.md) so a broken document stays visible here
// instead of being masked as $0.00.
//
// Two fields are computed by the endpoint rather than returned raw, both for the
// same reason — the site must not become a third evaluator of the JSONata charge
// expressions (research/fee-schedule-source.md, drift risk b):
//   - `rule`    — a machine-readable summary of the expression, which the site
//                 renders as a plain-language rule in EN/ES. `null` when the
//                 endpoint can't summarise the expression; the site then shows an
//                 explicit gap rather than inventing one (copy-map §3.4).
//   - `example` — one reference trip evaluated with the same code the meter uses.

/** A row of the rate card. Rate fields are optional: a missing rate renders as an
 *  explicit gap, never $0.00. Field names mirror the store, including the real
 *  single-l `cancelationFee` spelling. */
export interface RideService {
  id: string;
  name: string;
  baseFare?: number | null;
  costPerKm?: number | null;
  costPerMinute?: number | null;
  minimumFare?: number | null;
  cancelationFee?: number | null;
}

/** A charge's expression reduced to a shape the site can phrase in both languages.
 *  Anything the endpoint can't reduce comes back as `null`. */
export type ChargeRule =
  | { kind: "flat"; amount: number }
  | { kind: "per_minute"; amount: number }
  | { kind: "per_km"; amount: number }
  | { kind: "percent_of_fare"; percent: number; plus?: number };

export interface AppCharge {
  id: string;
  description: string;
  rule?: ChargeRule | null;
}

export interface ServiceAreaRef {
  id: string;
  identifier: string;
  /**
   * The area's circular region (yeride-functions#45), which `/fare-estimate`
   * resolves the rider's pickup against (#73). `radiusMeters` is named for its
   * unit so it cannot be guessed wrong.
   *
   * BOTH ARE OPTIONAL, and an unusable circle is an ABSENT KEY rather than a
   * null or a zero — the endpoint's acceptance rule 1, and the same rule the
   * rate fields keep. `/fees` ignores them; `src/lib/serviceArea.ts` reads them
   * and treats an area missing them as "we cannot tell", never as "the rider is
   * outside it".
   */
  center?: { lat: number; lng: number };
  radiusMeters?: number;
}

/** One reference trip, evaluated server-side. `appCharges` carries the amount the
 *  meter's own evaluator produced for each charge on that trip. */
export interface FeeScheduleExample {
  serviceId: string;
  distanceMeters: number;
  durationMinutes: number;
  fare: number;
  appCharges: { id: string; amount: number }[];
}

export interface FeeSchedule {
  /** ISO 8601. Renders as the "Fetched live" stamp. */
  fetchedAt: string;
  /** Every area the picker offers. */
  areas: ServiceAreaRef[];
  /** The area this response describes. */
  area: ServiceAreaRef;
  rideServices: RideService[];
  appCharges: AppCharge[];
  example?: FeeScheduleExample | null;
}

const ENDPOINT = import.meta.env.PUBLIC_FEE_SCHEDULE_URL;

/** Fetch the schedule. Omit `areaId` for the endpoint's default area. */
export async function getFeeSchedule(areaId?: string): Promise<FeeSchedule> {
  if (!ENDPOINT) throw new Error("PUBLIC_FEE_SCHEDULE_URL is not configured");
  // The deployed value is the absolute function URL; the base keeps a relative
  // one working for local stubs.
  const url = new URL(ENDPOINT, window.location.origin);
  if (areaId) url.searchParams.set("area", areaId);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`getFeeSchedule responded ${res.status}`);
  return (await res.json()) as FeeSchedule;
}

export const KM_PER_MILE = 1.609344;

/** Rates are metered per kilometre; the card shows an exact conversion. */
export const perMile = (costPerKm: number) => costPerKm * KM_PER_MILE;

export const metersToMiles = (meters: number) => meters / 1000 / KM_PER_MILE;

/** `null`/`undefined` is a gap in the source document, not a zero. */
export function usd(n: number | null | undefined): string | null {
  return typeof n === "number" && Number.isFinite(n) ? `$${n.toFixed(2)}` : null;
}
