import { Request, Response } from "express";
import {
  db as dbAdmin,
} from "../../utils/firebaseAdminConfig.js";
import admin from 'firebase-admin';

export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tripDocRef = dbAdmin.collection("trips").doc(id);
    const tripDoc = await tripDocRef.get();

    if (!tripDoc.exists) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const tripData = {
      documentId: tripDoc.id,
      ...tripDoc.data(),
    };

    const eventsSnapshot = await tripDocRef.collection("events").get();
    const events: any[] = [];
    eventsSnapshot.forEach((doc) => {
      events.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    const messagesSnapshot = await tripDocRef.collection("messages").get();
    const messages: any[] = [];
    messagesSnapshot.forEach((doc) => {
      messages.push({
        documentId: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      trip: tripData,
      events: events,
      messages: messages,
    });
  } catch (error) {
    console.error("Error fetching trip by ID:", error);
    return res.status(500).json({ message: "Error fetching trip by ID", error });
  }
};


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

export const updateTripStatus = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;

    if (!tripId || !status) {
      return res.status(400).json({ message: "ID del viaje y nuevo estado son requeridos." });
    }

    const allowedStatuses = [
      "awaiting_driver",
      "dispatched",
      "scheduled",
      "started",
      "completed",
      "passenger_canceled",
      "driver_canceled",
      "payment_succeeded",
      "closed",
      "payment_failed",
      "scheduled_driver_accepted",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado no válido." });
    }

    const tripDocRef = dbAdmin.collection("trips").doc(tripId);

    await tripDocRef.update({
      status: status,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return res.status(200).json({ message: "Estado del viaje actualizado exitosamente." });
  } catch (error) {
    console.error("Error updating trip status:", error);
    return res.status(500).json({ message: "Error al actualizar el estado del viaje", error });
  }
}