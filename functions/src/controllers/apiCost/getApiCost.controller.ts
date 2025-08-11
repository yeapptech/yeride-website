import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";


export const getApiCost = async (req: Request, res: Response) => {
  try {
    const docRef = dbAdmin.collection("apiCosts").doc("currentPrices");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res
        .status(404)
        .json({ message: "Current prices document not found." });
    }

    const currentPrices = docSnap.data();

    return res.status(200).json(currentPrices);
  } catch (error: any) {
    console.error("Error fetching current prices:", error);
    return res.status(500).json({
      message: "Error fetching current prices",
      error: error.message,
    });
  }
};
