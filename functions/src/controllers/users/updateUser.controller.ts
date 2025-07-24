import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

interface UpdateInsuranceStatusRequestBody {
  status: 'verified' | 'rejected';
}

export const updateDriverInsuranceStatus = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params; 
    const { status } = req.body as UpdateInsuranceStatusRequestBody; 

    console.debug(`Received request to update insurance status for user ID: ${userId} with status: ${status}`);

    if (!userId) {
      return res.status(400).json({ message: "User ID parameter is missing." });
    }

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: `Invalid or missing 'status': ${status}  in request body. Must be 'verified' or 'rejected'.` });
    }

    const userDocRef = dbAdmin.collection("users").doc(userId);

    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    await userDocRef.update({
      'driverOnboardingProgress.insuranceStatus': status,
    });

    return res.status(200).json({
      success: true,
      message: `User ${userId} insuranceStatus updated to ${status}.`,
    });

  } catch (error: any) {
    console.error("Error updating user insurance status:", error);
    return res.status(500).json({ message: "Error updating driver insurance status", error: error.message });
  }
};