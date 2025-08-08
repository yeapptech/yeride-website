import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

interface UpdateInsuranceStatusRequestBody {
  status: "verified" | "pending" | "rejected";
}

export const updateDriverInsuranceStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id: userId } = req.params;
    const { status } = req.body as UpdateInsuranceStatusRequestBody;

    if (!userId) {
      return res.status(400).json({ message: "User ID parameter is missing." });
    }

    if (!status || !["verified", "pending", "rejected"].includes(status)) {
      return res.status(400).json({
        message: `Invalid or missing 'status': ${status} in request body. Must be 'verified', 'pending' or 'rejected'.`,
      });
    }

    const userDocRef = dbAdmin
      .collection("driverOnBoardingProgress")
      .doc(userId);

    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = userDoc.data();
    if (!userData) {
      return res.status(500).json({ message: "User data is empty." });
    }

    let insuranceVerifiedStatus: boolean;

    if (status === "verified") {
      insuranceVerifiedStatus = true;
    } else {
      insuranceVerifiedStatus = false;
    }

    const updateData: { [key: string]: any } = {
      insuranceStatus: status,
      insuranceVerified: insuranceVerifiedStatus,
    };

    await userDocRef.update(updateData);

    console.log("userdocRef", (await userDocRef.get()).data());

    return res.status(200).json({
      success: true,
      message: `User ${userId} insuranceStatus updated to ${status}.`,
      driverOnBoardingProgress: (await userDocRef.get()).data()
    });
  } catch (error: any) {
    console.error("Error updating user insurance status:", error);
    return res.status(500).json({
      message: "Error updating driver insurance status",
      error: error.message,
    });
  }
};
