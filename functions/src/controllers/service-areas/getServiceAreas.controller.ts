import { Request, Response } from "express";
import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export const getServiceAreaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const serviceAreaDocRef = dbAdmin.collection("serviceAreas").doc(id);
    const serviceAreaDoc = await serviceAreaDocRef.get();

    if (!serviceAreaDoc.exists) {
      return res.status(404).json({ message: "No service areas found." });
    }

    const serviceAreaData = {
      appCharges: [],
      rideServices: [],
      ...serviceAreaDoc.data(),
    };

    // Fetch 'appCharges' subcollection
    const appChargesSnapshot = await serviceAreaDoc.ref.collection("appCharges").get();
    serviceAreaData.appCharges = appChargesSnapshot.docs.map((chargeDoc) => ({
      ...chargeDoc.data(),
    }));

    // Fetch 'rideServices' subcollection
    const rideServicesSnapshot = await serviceAreaDoc.ref.collection("rideServices").get();
    serviceAreaData.rideServices = rideServicesSnapshot.docs.map((rideDoc) => ({
      ...rideDoc.data(),
    }));

    return res.status(200).json({
      ...serviceAreaData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching serviceArea by ID", error });
  }
};

export const getServiceAreas = async (req: Request, res: Response) => {
  try {
    const serviceAreasRef = dbAdmin.collection("serviceAreas");
    const snapshot = await serviceAreasRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No service areas found." });
    }

    const serviceAreas: any[] = [];

    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const serviceAreaDoc = {
          appCharges: [],
          rideServices: [],
          ...doc.data(),
        };

        // Fetch 'appCharges' subcollection
        const appChargesSnapshot = await doc.ref.collection("appCharges").get();
        serviceAreaDoc.appCharges = appChargesSnapshot.docs.map(
          (chargeDoc) => ({
            ...chargeDoc.data(),
          })
        );

        // Fetch 'rideServices' subcollection
        const rideServicesSnapshot = await doc.ref
          .collection("rideServices")
          .get();
        serviceAreaDoc.rideServices = rideServicesSnapshot.docs.map(
          (rideDoc) => ({
            ...rideDoc.data(),
          })
        );

        serviceAreas.push(serviceAreaDoc);
      })
    );

    return res.status(200).json(serviceAreas);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching serviceAreas", error });
  }
};
