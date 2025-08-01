import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export const deleteAppCharge = async (req: any, res: any) => {
  try {
    const { serviceAreaId, appChargeId } = req.params;

    if (!serviceAreaId || !appChargeId) {
      return res
        .status(400)
        .json({
          message: "Service Area ID or App Charge ID parameter is missing.",
        });
    }

    const appChargeDocRef = dbAdmin
      .collection("serviceAreas")
      .doc(serviceAreaId)
      .collection("appCharges")
      .doc(appChargeId);

    const appChargeDoc = await appChargeDocRef.get();
    if (!appChargeDoc.exists) {
      return res.status(404).json({ message: "App charge not found." });
    }

    await appChargeDocRef.delete();

    return res.status(200).json({
      success: true,
      message: "App charge deleted successfully.",
      id: appChargeId,
    });
  } catch (error: any) {
    console.error("Error deleting app charge:", error);
    return res.status(500).json({
      message: "Error deleting app charge",
      error: error.message,
    });
  }
};
