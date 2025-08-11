import { Request, Response } from "express";
import { db as dbAdmin, firestoreFieldValue } from "../../utils/firebaseAdminConfig.js";

export const deleteApiCost = async (req: Request, res: Response) => {
  try {
    const { costName } = req.params;

    if (!costName || costName === 'totalAmount') {
      return res.status(400).json({ message: "Invalid costName or cannot delete 'totalAmount'." });
    }

    const docRef = dbAdmin.collection("apiCosts").doc("currentPrices");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: "Current prices document not found." });
    }

    const currentPrices = docSnap.data() as any;

    if (!currentPrices[costName]) {
      return res.status(404).json({ message: `Cost '${costName}' not found.` });
    }

    // Recalculate totalAmount before deletion
    const costToDelete = currentPrices[costName].cost;
    currentPrices.totalAmount -= costToDelete;

    // Delete the field using FieldValue.delete()
    const updateData = {
      [costName]: firestoreFieldValue.delete(),
      totalAmount: currentPrices.totalAmount
    };

    await docRef.update(updateData);

    return res.status(200).json({
      success: true,
      message: `Cost '${costName}' deleted successfully.`,
      newPrices: currentPrices
    });
  } catch (error: any) {
    console.error("Error deleting API cost:", error);
    return res.status(500).json({
      message: "Error deleting API cost",
      error: error.message,
    });
  }
};