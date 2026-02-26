import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export interface AppCharge {
  id: string;
  description: string;
  amount: number;
}

export interface ServiceEstimate {
  serviceId: string;
  serviceName: string;
  fare: number;
  appCharges: AppCharge[];
  appChargesTotal: number;
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

const DEFAULT_SERVICE_AREA_ID = "us-fl-south-florida";

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
