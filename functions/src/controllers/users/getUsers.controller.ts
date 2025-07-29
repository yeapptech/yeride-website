import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";
import { getVehiclesByUserId } from "./getVehiclesByUserId.js";
import { getStripeIdentityByUserId } from "./getStripeIdentityByUserId.js";
import { getOnboardingProgress } from "./getOnboardingProgress.js";
import { getCheckrData } from "./getCheckrData.js";

export const getUsersById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userDocRef = dbAdmin.collection("users").doc(id);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = {
      documentId: userDoc.id,
      ...userDoc.data(),
    };

    const vehicleDriverData = await getVehiclesByUserId(id);
    const stripeIdentityData = await getStripeIdentityByUserId(id);
    const onBoardingProgressData = await getOnboardingProgress(id);
    const checkrData = await getCheckrData(id);

    return res.status(200).json({
      user: userData,
      vehicleDrivers: vehicleDriverData,
      stripeIdentity: stripeIdentityData,
      onBoardingProgressData: onBoardingProgressData,
      checkrData: checkrData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching user by ID", error });
  }
};

export const getPendingDrivers = async (req: Request, res: Response) => {
  try {
    const usersRef = dbAdmin.collection("driverOnBoardingProgress");
    const snapshot = await usersRef
      .where("personalInfoCompleted", "==", false)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: `No drivers with pending approval were found`,
      });
    }

    const users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    const userIds = users.map((user) => user.documentId);

    const userDocs = await dbAdmin
      .collection("users")
      .where("id", "in", userIds)
      .get();

    const drivers: any[] = [];

    userDocs.forEach((doc) => {
      drivers.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json(drivers);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching drivers", error });
  }
};

export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { id: role } = req.params;

    if (!role) {
      return res.status(400).json({ message: "Role parameter is missing." });
    }

    const usersRef = dbAdmin.collection("users");
    const snapshot = await usersRef
      .where("role", "==", role)
      //   .where("driverOnboardingProgress.personalInfoCompleted", "==", false)
      .where("driverOnboardingProgress.insuranceVerified", "==", false)
      .get();

    if (snapshot.empty) {
      return res
        .status(404)
        .json({ message: `No users found with role: ${role}.` });
    }

    const users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const usersRef = dbAdmin.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No users found." });
    }

    const users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users", error });
  }
};
