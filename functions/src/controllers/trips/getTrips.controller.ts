import { Request, Response } from "express";
import {
  db as dbAdmin,
} from "../../utils/firebaseAdminConfig.js";

export const getTrips = async (req: Request, res: Response) => {
  try {
    const tripsRef = dbAdmin.collection("trips");
    const snapshot = await tripsRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No trips found." });
    }

    const trips: any[] = [];
    snapshot.forEach((doc) => {
      trips.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json(trips);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching trips", error });
  }
};