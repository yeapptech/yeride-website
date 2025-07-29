import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export interface StripeIdentity {
  documentId: string;
  userId: string;
  // Añade aquí otras propiedades que esperes de stripeIdentity
  // Por ejemplo:
  // make: string;
  // model: string;
  // year: number;
  // licensePlate: string;
}

/**
 * Obtiene los datos del vehículo asociado a un ID de usuario específico.
 * @param userId El ID del usuario.
 * @returns Una promesa que resuelve con un array de objetos stripeIdentity o un array vacío si no se encuentran vehículos.
 */
export const getStripeIdentityByUserId = async (
  userId: string
): Promise<StripeIdentity> => {
  try {
    const stripeIdentityRef = dbAdmin.collection("stripeIdentity");
    const stripeIdentitySnapshot = await stripeIdentityRef
      .where("userId", "==", userId)
      .get();

    if (stripeIdentitySnapshot.empty) {
      return null;
    }

    const doc = stripeIdentitySnapshot.docs[0];

    const stripeIdentityData: StripeIdentity = {
      ...doc.data(),
    } as StripeIdentity;

    return stripeIdentityData;
  } catch (error) {
    console.error(`Error fetching vehicles for user ${userId}:`, error);
    throw new Error(
      `Failed to fetch vehicles: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
