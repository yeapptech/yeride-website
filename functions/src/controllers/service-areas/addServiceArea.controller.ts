import { db } from "../../utils/firebaseAdminConfig.js"; // Ajusta la ruta
import * as admin from 'firebase-admin'; // Para los timestamps
import { ServiceArea } from "./serviceTypes.js";

interface CreateServiceAreaPayload {
    identifier: string;
    notifyOnDwell: boolean;
    notifyOnExit: boolean;
    radius: number;
    notifyOnEntry: boolean;
    latitude: number;
    longitude: number;
}

export const addServiceArea = async (req: any, res: any) => {
    try {
        const newServiceAreaData: CreateServiceAreaPayload = req.body;

        // 1. Validar datos mínimos
        if (!newServiceAreaData.identifier || 
            typeof newServiceAreaData.notifyOnDwell === 'undefined' || 
            typeof newServiceAreaData.notifyOnExit === 'undefined' ||
            typeof newServiceAreaData.radius === 'undefined' ||
            typeof newServiceAreaData.notifyOnEntry === 'undefined' ||
            typeof newServiceAreaData.latitude === 'undefined' ||
            typeof newServiceAreaData.longitude === 'undefined'
        ) {
            return res.status(400).json({ message: "Missing required service area fields." });
        }

        const serviceAreaDocRef = db.collection("serviceAreas").doc(newServiceAreaData.identifier);

        // 2. Verificar si ya existe un ServiceArea con este 'identifier'
        const existingDoc = await serviceAreaDocRef.get();
        if (existingDoc.exists) {
            return res.status(409).json({ // 409 Conflict si ya existe
                success: false,
                message: `Service Area with identifier '${newServiceAreaData.identifier}' already exists.`,
            });
        }

        // 3. Preparar los datos para Firestore
        const serviceAreaToCreate: Partial<ServiceArea> = {
            ...newServiceAreaData,
        };

        // 4. Crear el documento usando .set() con el identifier como ID del documento
        await serviceAreaDocRef.set(serviceAreaToCreate);

        return res.status(201).json({
            success: true,
            message: "Service Area created successfully.",
            id: newServiceAreaData.identifier, 
            data: serviceAreaToCreate 
        });

    } catch (error: any) {
        console.error("Error creating service area:", error);
        return res.status(500).json({
            message: "Error creating service area",
            error: error.message,
        });
    }
};