import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export interface VehicleDriver {
  documentId: string;
  userId: string;
  // Añade aquí otras propiedades que esperes de vehiclesDrivers
  // Por ejemplo:
  // make: string;
  // model: string;
  // year: number;
  // licensePlate: string;
}

/**
 * Obtiene los datos del vehículo asociado a un ID de usuario específico.
 * @param userId El ID del usuario.
 * @returns Una promesa que resuelve con un array de objetos VehicleDriver o un array vacío si no se encuentran vehículos.
 */
export const getVehiclesByUserId = async (
  userId: string
): Promise<VehicleDriver[]> => {
  try {
    const vehiclesDriversRef = dbAdmin.collection("vehiclesDrivers");
    const vehicleDriverSnapshot = await vehiclesDriversRef
      .where("userId", "==", userId)
      .get();

    const vehicleDriverData: VehicleDriver[] = [];

    if (!vehicleDriverSnapshot.empty) {
      vehicleDriverSnapshot.forEach((doc) => {
        vehicleDriverData.push({
          ...doc.data(),
        } as VehicleDriver);
      });
    }
    return vehicleDriverData;
  } catch (error) {
    console.error(`Error fetching vehicles for user ${userId}:`, error);
    throw new Error(
      `Failed to fetch vehicles: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
