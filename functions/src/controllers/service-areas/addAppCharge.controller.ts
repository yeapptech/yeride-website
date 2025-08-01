import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";
import { AppCharge } from "./serviceTypes.js";

export const addAppCharge = async (req: Request, res: Response) => {
  try {
    const { serviceAreaId } = req.params;
    const serviceData: AppCharge = req.body;

    if (!serviceAreaId) {
      return res
        .status(400)
        .json({ message: "Service Area ID parameter is missing." });
    }

    if (!serviceData || !serviceData.id) {
      return res.status(400).json({
        message: "Request body must contain app charge data with an ID.",
      });
    }

    if (Object.keys(serviceData).length <= 1) {
      return res.status(400).json({
        message:
          "Request body must contain actual service data beyond just the ID for creation.",
      });
    }

    const serviceAreaDocRef = dbAdmin
      .collection("serviceAreas")
      .doc(serviceAreaId);
    const serviceAreaDoc = await serviceAreaDocRef.get();

    if (!serviceAreaDoc.exists) {
      return res.status(404).json({ message: "Service area not found." });
    }

    const appChargeDocRef = serviceAreaDocRef
      .collection("appCharges")
      .doc(serviceData.id);

    const existingAppChargeDoc = await appChargeDocRef.get();
    if (existingAppChargeDoc.exists) {
      return res.status(409).json({
        success: false,
        message: `App charge with ID '${serviceData.id}' already exists. Please choose a different ID.`,
      });
    }

    await appChargeDocRef.set(serviceData);

    return res.status(201).json({
      success: true,
      message: "App charge added successfully.",
      id: serviceData.id,
      data: serviceData,
    });
  } catch (error: any) {
    console.error("Error adding ride service:", error);
    return res.status(500).json({
      message: "Error adding ride service",
      error: error.message,
    });
  }
};
