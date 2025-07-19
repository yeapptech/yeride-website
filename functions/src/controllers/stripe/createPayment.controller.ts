import * as functionsLogger from "firebase-functions/logger";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import { STRIPE_SECRET_KEY } from "../../conf/env.js";
import { Request, Response } from "express";

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_API_VERSION = "2025-06-30.basil";

interface CreatePaymentIntentRequestBody {
  currency: string;
  description: string;
}

interface ApiCostsData {
  backgroundCheckCost?: { cost: number };
  platformAPIUsageCost?: { cost: number };
}

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const createApiCostsPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
  const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
    apiVersion: STRIPE_API_VERSION,
  });

  try {
    const { currency, description } = req.body as CreatePaymentIntentRequestBody;

    const authenticatedUserId = req.user?.uid;
    if (!authenticatedUserId) {
      functionsLogger.warn(
        "createApiCostsPaymentIntent: Usuario no autenticado. Token de ID de Firebase válido requerido."
      );
      res
        .status(401)
        .json({
          error: "No autenticado. Token de ID de Firebase válido requerido.",
        });
      return;
    }

    if (
      !currency ||
      typeof currency !== "string" ||
      currency.toLowerCase() !== "usd"
    ) {
      functionsLogger.warn("Validación fallida: Moneda inválida o faltante.");
      res
        .status(400)
        .json({ error: "La moneda es requerida y debe ser USD." });
      return;
    }
    if (!description || typeof description !== "string") {
      functionsLogger.warn("Validación fallida: Descripción inválida o faltante.");
      res.status(400).json({ error: "Una descripción es requerida." });
      return;
    }

    const apiCostsRef = admin
      .firestore()
      .collection("apiCosts")
      .doc("currentPrices");
    functionsLogger.log(
      `Obteniendo costos de API desde Firestore en ${apiCostsRef.path} para el usuario ${authenticatedUserId}`
    );
    const apiCostsDoc = await apiCostsRef.get();

    if (!apiCostsDoc.exists) {
      functionsLogger.error(
        "¡Documento de costos de API 'currentPrices' no encontrado en Firestore!"
      );
      res
        .status(500)
        .json({
          error:
            "Configuración de costos de API no encontrada. Asegúrate de que esté inicializada.",
        });
      return;
    }

    const costsData = apiCostsDoc.data() as ApiCostsData | undefined;

    if (!costsData) {
      functionsLogger.error(
        "Los datos del documento de costos de API están vacíos o corruptos."
      );
      res.status(500).json({ error: "Datos de costos de API no válidos." });
      return;
    }

    let totalCostUSD = 0;
    totalCostUSD += costsData.backgroundCheckCost?.cost ?? 0;
    totalCostUSD += costsData.platformAPIUsageCost?.cost ?? 0;

    const amountInCents = Math.round(totalCostUSD * 100);

    if (amountInCents <= 0) {
      functionsLogger.log(
        `El costo total de API para el usuario ${authenticatedUserId} es cero (${totalCostUSD} USD). No se creó ninguna intención de pago.`
      );
      res
        .status(200)
        .json({
          clientSecret: null,
          totalAmount: 0,
          message: "No se requiere pago.",
        });
      return;
    }

    let customerId: string;
    const userRef = admin
      .firestore()
      .collection("people")
      .doc(authenticatedUserId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() as { stripeCustomerId?: string; email?: string } | undefined;

    if (userData && userData.stripeCustomerId) {
      customerId = userData.stripeCustomerId;
      functionsLogger.log(
        `Usando el cliente Stripe existente para ${authenticatedUserId}: ${customerId}`
      );
    } else {
      const customer = await stripe.customers.create({
        email: userData?.email || `user-${authenticatedUserId}@example.com`,
        metadata: { firebaseUid: authenticatedUserId },
      });
      customerId = customer.id;
      await userRef.update({ stripeCustomerId: customer.id });
      functionsLogger.log(
        `Cliente Stripe creado para ${authenticatedUserId}: ${customerId}`
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      customer: customerId,
      description: description,
      metadata: {
        firebaseUid: authenticatedUserId,
        paymentType: "api_costs",
        totalCostUSD: totalCostUSD.toFixed(2),
      },
      automatic_payment_methods: { enabled: true },
      setup_future_usage: "off_session",
    });

    functionsLogger.log(
      "DEBUG: Intención de pago creada completamente:",
      paymentIntent.id, paymentIntent.client_secret
    );
    functionsLogger.log(
      `Intención de pago creada para el usuario ${authenticatedUserId}: ${paymentIntent.id} con un monto de ${totalCostUSD} USD`
    );
    res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmount: totalCostUSD,
    });
    return;
  } catch (error: any) {
    functionsLogger.error(
      "Error al crear la intención de pago de costos de API:",
      error
    );

    if (error instanceof Stripe.errors.StripeError) {
      res
        .status(error.statusCode || 500)
        .json({ error: error.message, code: error.code });
      return;
    }

    const errorMessage = (error as Error)?.message || "No se pudo crear la intención de pago. Error desconocido.";
    res
      .status(500)
      .json({ error: errorMessage });
    return;
  }
};