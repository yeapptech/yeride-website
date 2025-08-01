import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";
import { deleteCollection } from "../../utils/deleteCollection.js";

export const deleteServiceArea = async (req: Request, res: Response) => {
  try {
    const { serviceAreaId } = req.params;

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
      return res
        .status(404)
        .json({
          message: `Service Area with ID '${serviceAreaId}' not found.`,
        });
    }

    // --- ELIMINAR SUBCOLECCIONES PRIMERO ---

    // Eliminar subcolección 'rideServices'
    const rideServicesCollectionRef =
      serviceAreaDocRef.collection("rideServices");
    console.log(`Deleting rideServices for Service Area: ${serviceAreaId}`);
    await deleteCollection(rideServicesCollectionRef, 100);

    // Eliminar subcolección 'appCharges'
    const appChargesCollectionRef = serviceAreaDocRef.collection("appCharges");
    console.log(`Deleting appCharges for Service Area: ${serviceAreaId}`);
    await deleteCollection(appChargesCollectionRef, 100);

    // Finalmente, eliminar el documento principal del Service Area
    await serviceAreaDocRef.delete();

    return res.status(200).json({
      // 200 OK para una eliminación exitosa
      success: true,
      message: `Service Area '${serviceAreaId}' and its subcollections deleted successfully.`,
      id: serviceAreaId,
    });
  } catch (error: any) {
    console.error("Error deleting service area:", error);
    return res.status(500).json({
      message: "Error deleting service area",
      error: error.message,
    });
  }
};
