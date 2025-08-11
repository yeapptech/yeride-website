import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";


export const updateApiCost = async (req: Request, res: Response) => {
  try {
    const { costName } = req.params;
    const { cost } = req.body as any;

    if (!costName || typeof cost !== 'number') {
      return res.status(400).json({ message: "Invalid costName or new cost value." });
    }

    const docRef = dbAdmin.collection("apiCosts").doc("currentPrices");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: "Current prices document not found." });
    }

    const currentPrices = docSnap.data() as any; 

    // Check if the field exists (and is not 'totalAmount')
    if (!currentPrices[costName] || costName === 'totalAmount') {
      return res.status(400).json({ message: `Field '${costName}' cannot be updated or does not exist.` });
    }

    // Update the cost
    currentPrices[costName].cost = cost;

    // Recalculate totalAmount
    let newTotalAmount = 0;
    for (const key in currentPrices) {
      if (key !== 'totalAmount' && currentPrices[key].cost) {
        newTotalAmount += currentPrices[key].cost;
      }
    }
    currentPrices.totalAmount = newTotalAmount;

    // Update the document in Firestore
    await docRef.update(currentPrices);

    return res.status(200).json({
      success: true,
      message: `Cost for '${costName}' updated successfully.`,
      newPrices: currentPrices
    });
  } catch (error: any) {
    console.error("Error updating API cost:", error);
    return res.status(500).json({
      message: "Error updating API cost",
      error: error.message,
    });
  }
};