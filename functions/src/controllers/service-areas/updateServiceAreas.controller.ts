import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

interface RideServiceUpdatePayload {
  id: string;
  [key: string]: any;
}

interface AppChargeUpdatePayload {
  id: string;
  [key: string]: any;
}

interface ServiceAreaUpdateRequestBody {
  rideService?: RideServiceUpdatePayload;
  appCharge?: AppChargeUpdatePayload;
  [key: string]: any;
}

export const updateServiceAreas = async (req: Request, res: Response) => {
  try {
    const { id: serviceAreaId } = req.params;
    const data: ServiceAreaUpdateRequestBody = req.body;

    if (!serviceAreaId) {
      return res
        .status(400)
        .json({ message: "Service Area ID parameter is missing." });
    }

    const serviceAreaDocRef = dbAdmin
      .collection("serviceAreas")
      .doc(serviceAreaId);
    const serviceAreaDoc = await serviceAreaDocRef.get();

    if (!serviceAreaDoc.exists) {
      return res.status(404).json({ message: "No service areas found." });
    }

    const {
      rideService: rideServiceUpdates,
      appCharge: appChargeUpdates,
      ...restDataUpdates
    } = data;

    // --- Manejo de rideService ---
    if (rideServiceUpdates && rideServiceUpdates.id) {
      const { id: rideServiceId, ...updatesForRideServiceDoc } =
        rideServiceUpdates;

      if (Object.keys(updatesForRideServiceDoc).length > 0) {
        const rideServicesDocRef = serviceAreaDocRef
          .collection("rideServices")
          .doc(rideServiceId);

        console.debug("Updating rideService with:", updatesForRideServiceDoc);
        await rideServicesDocRef.update(updatesForRideServiceDoc);
      } else {
        console.debug("No changes for rideService, skipping update.");
      }
    }

    // --- Manejo de appCharge ---
    if (appChargeUpdates && appChargeUpdates.id) {
      const { id: appChargeId, ...updatesForAppChargeDoc } = appChargeUpdates;

      if (Object.keys(updatesForAppChargeDoc).length > 0) {
        const appChargesDocRef = serviceAreaDocRef
          .collection("appCharges")
          .doc(appChargeId);

        console.debug("Updating appCharge with:", updatesForAppChargeDoc);
        await appChargesDocRef.update(updatesForAppChargeDoc);
      } else {
        console.debug("No changes for appCharge, skipping update.");
      }
    }

    // --- Manejo de campos directos de serviceArea ---
    if (Object.keys(restDataUpdates).length > 0) {
      console.debug(
        "Updating serviceArea main document with:",
        restDataUpdates
      );
      await serviceAreaDocRef.update(restDataUpdates);
    } else {
      console.debug(
        "No direct changes for serviceArea document, skipping update."
      );
    }

    return res.status(200).json({
      success: true,
      message: `Service Area ${serviceAreaId} updated`,
    });
  } catch (error: any) {
    console.error("Error updating:", error);
    return res.status(500).json({
      message: "Error updating",
      error: error.message,
    });
  }
};
