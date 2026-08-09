import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export interface ServiceEstimate {
  serviceId: string;
  name: string;
  description: string;
  seat: number | null;
  /**
   * The metered fare, and the rider's whole number: on card the rider is
   * charged exactly this, on cash they hand exactly this to the driver.
   *
   * Nullable because the wire says so, not defensively: the callable's JSON
   * serialises a non-finite fare as `null` (yeride-functions#28 — `Infinity`
   * passes that handler's validation), and `calculateFare` returns 0 outright
   * when a `rideServices` document is missing its rates. Neither is a price,
   * so both render as a gap — never $0.00.
   */
  fare: number | null;

  // `estimateFares` NO LONGER returns `appCharges` or `appChargesTotal`. It
  // used to, and this type deliberately declined to declare them — a
  // rider-facing type that declares them invites a rider-facing page to render
  // them. That refusal is why the fields are gone: yeride-functions#37 went
  // looking for a reader, found this file declining them by name and no
  // program anywhere else reading them at all, and withdrew the whole surface
  // (yeride-functions#47). Nothing here needs adding back.
  //
  // The reasoning stands and is why this note survives the withdrawal. They
  // are the DRIVER's cost in both payment flows (`yeride-functions
  // lib/payments.js` L370–400 and L682–708 — the two `/charges-create` call
  // sites; the L268–310 this used to cite is retry handling, not the charge):
  // on card YeRide takes the total from the
  // driver's connected account as the application fee; on cash it bills the
  // driver's account after the trip. Nothing in that total is added to what
  // the rider pays, so showing it beside a rider's fare would claim they pay
  // money they do not (copy-map §3.5, amended by #47; yeride-functions#28 §3).
  //
  // They were also the fields yeride-functions#28 says the estimate cannot
  // always compute — a charge reading pickup wait time quotes 0 and is
  // indistinguishable from free. That is the driver's disclosure problem to
  // solve, in the app that shows drivers their charges, not this page's.
  //
  // /fees is where YeRide's charges are published, whose they are explained,
  // and where a value the endpoint could not compute renders as a gap. It
  // reads `getFeeSchedule`, which is untouched by the withdrawal.
}

export interface FareEstimateResponse {
  serviceAreaId: string;
  estimates: ServiceEstimate[];
}

interface FareEstimateRequest {
  serviceAreaId: string;
  distance: number;
  duration: number;
}

/**
 * 🔴 `serviceAreaId` is REQUIRED, and deliberately has no default.
 *
 * It used to default to `DEFAULT_SERVICE_AREA_ID`, and that default silently
 * ate the whole of #73: the page resolved the rider's area, rendered it into
 * the "Priced for" label, and then called this with two arguments — so every
 * fare was still quoted at South Florida rates while the label named the
 * rider's actual area. A wrong number wearing a correct label, which is worse
 * than the disclosed-wrong-number state #62 shipped.
 *
 * Nothing caught it. `astro check` was happy because the parameter was
 * optional; the unit controls do not reach this far; and the browser pass
 * missed it because production publishes exactly ONE area, so the resolved id
 * and the default are the same string. It would have surfaced only on the day
 * a second market opened — the day this page finally mattered.
 *
 * Required, the omission is a type error. Do not give this a default again:
 * the caller always knows which area it resolved, including when that is the
 * fallback, and a default here only lets a caller forget to say.
 */
export async function getEstimates(
  distance: number,
  duration: number,
  serviceAreaId: string,
): Promise<FareEstimateResponse> {
  const estimateFares = httpsCallable<
    FareEstimateRequest,
    FareEstimateResponse
  >(functions, "estimateFares");
  const result = await estimateFares({ serviceAreaId, distance, duration });
  return result.data;
}
