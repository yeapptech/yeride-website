import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";


export const getDriverVisualControl = async (req: Request, res: Response) => {
  try {
    const docRef = dbAdmin.collection("drivervisualcontrol").doc("onboarding");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res
        .status(404)
        .json({ message: "Current controls not found." });
    }

    const currentControls = docSnap.data();

    return res.status(200).json(currentControls);
  } catch (error: any) {
    console.error("Error fetching current controls:", error);
    return res.status(500).json({
      message: "Error fetching current controls",
      error: error.message,
    });
  }
};

