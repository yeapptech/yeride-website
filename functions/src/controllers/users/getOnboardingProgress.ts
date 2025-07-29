import { db as dbAdmin } from "../../utils/firebaseAdminConfig.js";

export interface OnboardingProgress {
  documentId: string;
  userId: string;
  // Añade aquí otras propiedades que esperes de onboardingProgress
  // Por ejemplo:
  // make: string;
  // model: string;
  // year: number;
  // licensePlate: string;
}

/**
 * Obtiene los datos del vehículo asociado a un ID de usuario específico.
 * @param userId El ID del usuario.
 * @returns Una promesa que resuelve con un array de objetos onboardingProgress o un array vacío si no se encuentran vehículos.
 */
export const getOnboardingProgress = async (
  userId: string
): Promise<OnboardingProgress> => {
  try {
    const onboardingProgressRef = dbAdmin.collection(
      "driverOnBoardingProgress"
    );
    const onboardingProgressSnapshot = await onboardingProgressRef
      .where("userId", "==", userId)
      .get();

    if (onboardingProgressSnapshot.empty) {
      return null;
    }

    const doc = onboardingProgressSnapshot.docs[0];

    const onboardingProgressData: OnboardingProgress = {
      ...doc.data(),
    } as OnboardingProgress;

    return onboardingProgressData;
  } catch (error) {
    console.error(`Error fetching vehicles for user ${userId}:`, error);
    throw new Error(
      `Failed to fetch vehicles: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
