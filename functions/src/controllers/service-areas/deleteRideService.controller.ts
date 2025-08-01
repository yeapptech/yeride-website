// functions/src/controllers/ride-services/deleteRideService.controller.ts

import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export const deleteRideService = async (req: any, res: any) => {
  try {
    const { serviceAreaId, rideServiceId } = req.params;

    if (!serviceAreaId || !rideServiceId) {
      return res
        .status(400)
        .json({
          message: "Service Area ID or Ride Service ID parameter is missing.",
        });
    }

    const rideServiceDocRef = dbAdmin
      .collection("serviceAreas")
      .doc(serviceAreaId)
      .collection("rideServices")
      .doc(rideServiceId);

    const rideServiceDoc = await rideServiceDocRef.get();
    if (!rideServiceDoc.exists) {
      return res.status(404).json({ message: "Ride service not found." });
    }

    await rideServiceDocRef.delete();

    return res.status(200).json({
      success: true,
      message: "Ride service deleted successfully.",
      id: rideServiceId,
    });
  } catch (error: any) {
    console.error("Error deleting ride service:", error);
    return res.status(500).json({
      message: "Error deleting ride service",
      error: error.message,
    });
  }
};
