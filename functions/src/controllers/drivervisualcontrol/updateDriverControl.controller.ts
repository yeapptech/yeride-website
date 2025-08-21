import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export const updateDriverVisualControl = async (req: Request, res: Response) => {
  try {
    const docRef = dbAdmin.collection("drivervisualcontrol").doc("onboarding");

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    const existingKeys = Object.keys(docSnap.data() as object);

    const fieldsToUpdate = req.body;
    const sanitizedFields: { [key: string]: any } = {};

    for (const key in fieldsToUpdate) {
      if (existingKeys.includes(key)) {
        sanitizedFields[key] = fieldsToUpdate[key];
      }
    }

    if (Object.keys(sanitizedFields).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update",
      });
    }

    // 4. Usar el objeto filtrado para la actualización
    await docRef.update(sanitizedFields);

    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    return res.status(200).json({
      message: "Controls updated successfully",
      updatedData,
    });
  } catch (error: any) {
    console.error("Error updating controls:", error);
    return res.status(500).json({
      message: "Error updating controls",
      error: error.message,
    });
  }
};