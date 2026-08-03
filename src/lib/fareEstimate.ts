import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { DEFAULT_SERVICE_AREA_ID } from "./serviceArea";

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

  // `estimateFares` also returns `appCharges` and `appChargesTotal`. They are
  // NOT declared here, and that is the point — a rider-facing type that
  // declares them invites a rider-facing page to render them.
  //
  // They are the DRIVER's cost in both payment flows (`yeride-functions
  // lib/payments.js` L268–310): on card YeRide takes the total from the
  // driver's connected account as the application fee; on cash it bills the
  // driver's account after the trip. Nothing in that total is added to what
  // the rider pays, so showing it beside a rider's fare would claim they pay
  // money they do not (copy-map §3.5, amended by #47; yeride-functions#28 §3).
  //
  // They are also the fields yeride-functions#28 says the estimate cannot
  // always compute — a charge reading pickup wait time quotes 0 and is
  // indistinguishable from free. That is the driver's disclosure problem to
  // solve, in the app that shows drivers their charges, not this page's.
  //
  // /fees is where YeRide's charges are published, whose they are explained,
  // and where a value the endpoint could not compute renders as a gap.
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

export async function getEstimates(
  distance: number,
  duration: number,
  serviceAreaId: string = DEFAULT_SERVICE_AREA_ID,
): Promise<FareEstimateResponse> {
  const estimateFares = httpsCallable<
    FareEstimateRequest,
    FareEstimateResponse
  >(functions, "estimateFares");
  const result = await estimateFares({ serviceAreaId, distance, duration });
  return result.data;
}
