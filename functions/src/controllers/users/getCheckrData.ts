import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export interface CheckrData {
  documentId: string;
  userId: string;
  // Añade aquí otras propiedades que esperes de checkrData
  // Por ejemplo:
  // make: string;
  // model: string;
  // year: number;
  // licensePlate: string;
}

/**
 * Obtiene los datos del vehículo asociado a un ID de usuario específico.
 * @param userId El ID del usuario.
 * @returns Una promesa que resuelve con un array de objetos checkrData o un array vacío si no se encuentran vehículos.
 */
export const getCheckrData = async (userId: string): Promise<CheckrData> => {
  try {
    const checkrDataRef = dbAdmin.collection("checkrData");
    const checkrDataSnapshot = await checkrDataRef
      .where("userId", "==", userId)
      .get();

    if (checkrDataSnapshot.empty) {
      return null;
    }

    const doc = checkrDataSnapshot.docs[0];

    const checkrData: CheckrData = {
      ...doc.data(),
    } as CheckrData;

    return checkrData;
  } catch (error) {
    console.error(`Error fetching vehicles for user ${userId}:`, error);
    throw new Error(
      `Failed to fetch vehicles: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
