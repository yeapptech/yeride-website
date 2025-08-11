import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

interface NewCostRequestBody {
  cost: number;
  description: string;
}

export const addApiCost = async (req: Request, res: Response) => {
  try {
    const { costName } = req.params;
    const { cost, description } = req.body as NewCostRequestBody;

    if (!costName || typeof cost !== 'number' || !description) {
      return res.status(400).json({ message: "Invalid costName, cost, or description." });
    }

    const docRef = dbAdmin.collection("apiCosts").doc("currentPrices");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: "Current prices document not found." });
    }

    const currentPrices = docSnap.data() as any;

    if (currentPrices[costName]) {
      return res.status(409).json({ message: `Cost '${costName}' already exists.` });
    }

    // Add the new field
    currentPrices[costName] = { cost, description };
    currentPrices.totalAmount += cost; // Update totalAmount

    await docRef.update(currentPrices);

    return res.status(201).json({
      success: true,
      message: `New cost '${costName}' added successfully.`,
      newPrices: currentPrices
    });
  } catch (error: any) {
    console.error("Error adding new API cost:", error);
    return res.status(500).json({
      message: "Error adding new API cost",
      error: error.message,
    });
  }
};