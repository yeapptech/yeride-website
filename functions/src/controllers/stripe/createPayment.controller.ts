import { onRequest } from "firebase-functions/v2/https";
import * as functionsLogger from "firebase-functions/logger"; 

import Stripe from 'stripe';
import admin from 'firebase-admin';

import { STRIPE_SECRET_KEY } from "../../conf/env.js";

const STRIPE_API_VERSION = '2025-06-30.basil';

export const createApiCostsPaymentIntent = onRequest(
  {
    secrets: [STRIPE_SECRET_KEY], 
  },
  // @ts-ignore
  async (req, res) => {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    });

    try {
        const { currency, description } = req.body;

        // @ts-ignore
        const authenticatedUserId = req.user?.uid;
        if (!authenticatedUserId) {
            functionsLogger.warn('createApiCostsPaymentIntent: Usuario no autenticado. Token de ID de Firebase válido requerido.');
            return res.status(401).json({ error: 'No autenticado. Token de ID de Firebase válido requerido.' });
        }

        if (!currency || typeof currency !== 'string' || currency.toLowerCase() !== 'usd') {
            return res.status(400).json({ error: 'La moneda es requerida y debe ser USD.' });
        }
        if (!description || typeof description !== 'string') {
            return res.status(400).json({ error: 'Una descripción es requerida.' });
        }

        const apiCostsRef = admin.firestore().collection('apiCosts').doc('currentPrices');
        functionsLogger.log(`Obteniendo costos de API desde Firestore en ${apiCostsRef.path} para el usuario ${authenticatedUserId}`);
        const apiCostsDoc = await apiCostsRef.get();

        if (!apiCostsDoc.exists) {
            functionsLogger.error('¡Documento de costos de API no encontrado en Firestore!');
            return res.status(500).json({ error: 'Configuración de costos de API no encontrada. Asegúrate de que esté inicializada.' });
        }

        const costsData = apiCostsDoc.data();
        let totalCostUSD = 0;

        totalCostUSD += (costsData.backgroundCheckCost?.cost || 0);
        totalCostUSD += (costsData.platformAPIUsageCost?.cost || 0);

        const amountInCents = Math.round(totalCostUSD * 100);

        if (amountInCents <= 0) {
            functionsLogger.log(`El costo total de API para el usuario ${authenticatedUserId} es cero. No se creó ninguna intención de pago.`);
            return res.status(200).json({ clientSecret: null, totalAmount: 0, message: 'No se requiere pago.' });
        }

        let customerId;
        const userRef = admin.firestore().collection('users').doc(authenticatedUserId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (userData && userData.stripeCustomerId) {
            customerId = userData.stripeCustomerId;
            functionsLogger.log(`Usando el cliente Stripe existente para ${authenticatedUserId}: ${customerId}`);
        } else {
            const customer = await stripe.customers.create({
                email: userData?.email || `${authenticatedUserId}@example.com`,
                metadata: { firebaseUid: authenticatedUserId },
            });
            customerId = customer.id;
            await userRef.update({ stripeCustomerId: customer.id });
            functionsLogger.log(`Cliente Stripe creado para ${authenticatedUserId}: ${customerId}`);
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency,
            customer: customerId,
            description: description,
            metadata: { firebaseUid: authenticatedUserId, paymentType: 'api_costs', totalCostUSD: totalCostUSD.toFixed(2) },
            automatic_payment_methods: { enabled: true },
            setup_future_usage: 'off_session',
        });

        functionsLogger.log("DEBUG: Intención de pago creada completamente:", paymentIntent);
        functionsLogger.log(`Intención de pago creada para el usuario ${authenticatedUserId}: ${paymentIntent.id} con un monto de ${totalCostUSD} USD`);
        res.json({ clientSecret: paymentIntent.client_secret, totalAmount: totalCostUSD });

    } catch (error) {
        functionsLogger.error("Error al crear la intención de pago de costos de API:", error);
        // @ts-ignore
        if (error instanceof Stripe.StripeError) {
            return res.status(error.statusCode || 500).json({ error: error.message, code: error.code });
        }
        return res.status(500).json({ error: error.message || 'No se pudo crear la intención de pago.' });
    }
  }
);