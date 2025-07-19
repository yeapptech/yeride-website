import { Response } from "express"; // Importa Response de 'express'
import * as functionsLogger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../conf/env.js";

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_API_VERSION = "2025-06-30.basil";

export const verifyApiCostsPaymentStatus = async (req: any, res: Response) => {
  const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
    apiVersion: STRIPE_API_VERSION,
  });

  try {
    const { clientSecret } = req.body as any;

    const authenticatedUserId = req.user?.uid;
    if (!authenticatedUserId) {
      functionsLogger.warn(
        "verifyApiCostsPaymentStatus: Usuario no autenticado."
      );
      res
        .status(401)
        .json({
          error: "Unauthenticated. A valid Firebase user ID token is required.",
        });
      return;
    }

    if (!clientSecret || typeof clientSecret !== "string") {
      functionsLogger.warn(
        `verifyApiCostsPaymentStatus: Client secret is required or invalid for user ${authenticatedUserId}.`
      );
      res.status(400).json({ error: "Client secret is required." });
      return;
    }

    const paymentIntentId = clientSecret.split("_secret_")[0];
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    if (paymentIntent.metadata.firebaseUid !== authenticatedUserId) {
      functionsLogger.warn(
        `verifyApiCostsPaymentStatus: Permission denied. Payment intent ${paymentIntentId} does not belong to user ${authenticatedUserId}.`
      );
      res
        .status(403)
        .json({
          error: "Permission denied. Payment intent does not belong to this user.",
        });
      return;
    }

    let cardDetailsToSave: Stripe.PaymentMethod.Card | null = null;
    const paymentMethodId: string | null | undefined =
      typeof paymentIntent.payment_method === "string"
        ? paymentIntent.payment_method
        : null;

    if (paymentMethodId) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );

        if (paymentMethod.type === "card" && paymentMethod.card) {
          cardDetailsToSave = {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year,
            country: paymentMethod.card.country,
            fingerprint: paymentMethod.card.fingerprint,
            funding: paymentMethod.card.funding,
            checks: paymentMethod.card.checks,
            display_brand: paymentMethod.card.display_brand,
            generated_from: paymentMethod.card.generated_from,
            networks: paymentMethod.card.networks,
            three_d_secure_usage: paymentMethod.card.three_d_secure_usage,
            wallet: paymentMethod.card.wallet,
            regulated_status: paymentMethod.card.regulated_status,
          };
          functionsLogger.log(
            `Card details retrieved for PaymentMethod ${paymentMethodId}:`,
            cardDetailsToSave
          );

          const userPaymentMethodsRef = admin
            .firestore()
            .collection("people")
            .doc(authenticatedUserId)
            .collection("paymentMethods");

          await userPaymentMethodsRef.doc(paymentMethodId).set(
            {
              paymentMethodId: paymentMethodId,
              card: cardDetailsToSave,
              customerId: paymentIntent.customer,
              isDefault: false,
              createdAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          functionsLogger.log(
            `PaymentMethod ${paymentMethodId} saved to user's subcollection.`
          );

          await admin
            .firestore()
            .collection("people")
            .doc(authenticatedUserId)
            .update({
              lastUsedPaymentMethodId: paymentMethodId,
            });
        } else {
          functionsLogger.warn(
            `PaymentMethod ${paymentMethodId} is not a card or has no card details.`
          );
        }
      } catch (pmError: any) {
        functionsLogger.error(
          `Error retrieving PaymentMethod ${paymentMethodId}:`,
          pmError
        );
      }
    } else {
      functionsLogger.warn(
        `PaymentIntent ${paymentIntent.id} has no associated payment_method.`
      );
    }

    const paymentRecordRef = admin
      .firestore()
      .collection("apiPayments")
      .doc(paymentIntent.id);
    await paymentRecordRef.set(
      {
        userId: authenticatedUserId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        createdAt: FieldValue.serverTimestamp(),
        cardDetails: cardDetailsToSave,
        paymentMethodId: paymentMethodId,
      },
      { merge: true }
    );

    res.json({ status: paymentIntent.status });
    return;
  } catch (error: any) {
    functionsLogger.error(
      "Error verifying API Costs PaymentIntent status:",
      error
    );
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === "resource_missing") {
        res.status(404).json({ error: "Payment Intent not found." });
        return;
      }
      res
        .status(error.statusCode || 500)
        .json({ error: error.message || "Unable to verify payment status." });
      return;
    }
    const errorMessage =
      (error as Error)?.message || "Unable to verify payment status.";
    res.status(500).json({ error: errorMessage });
    return;
  }
};