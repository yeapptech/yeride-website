import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export const getWhitelist = async (req: Request, res: Response) => {
  try {
    const whitelistRef = dbAdmin.collection("whitelist");
    const snapshot = await whitelistRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No users found." });
    }

    const whitelist: any[] = [];
    snapshot.forEach((doc) => {
      whitelist.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json(whitelist);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching whitelist", error });
  }
};
