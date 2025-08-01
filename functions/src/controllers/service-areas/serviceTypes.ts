import * as admin from "firebase-admin";

export interface ServiceArea {
  appCharges: AppCharge[];
  rideServices: RideService[];
  identifier: string;
  notifyOnDwell: boolean;
  notifyOnExit: boolean;
  radius: number;
  notifyOnEntry: boolean;
  latitude: number;
  longitude: number;
}

export interface AppCharge {
  expression: string;
  description: string;
  id: string;
}

export interface RideService {
  seat: number | string;
  cancelationFee: number;
  costPerMinute: number;
  name: string;
  description: string;
  id: string;
  minimumFare: number;
  baseFare: number;
  costPerKm: number;
}
