import { Request, Response } from "express"; // Importa Request y Response de 'express'
import * as functionsLogger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../conf/env.js";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const STRIPE_API_VERSION = "2025-06-30.basil";

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

interface CreateAccountLinkRequestBody {
  return_url: string;
  refresh_url: string;
}

interface DriverData {
  stripeAccountId?: string | null;
  email?: string;
}

interface AccountStatusResponse {
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: {
    currently_due: string[];
    past_due: string[];
    eventually_due: string[];
    disabled_reason: string | null;
  };
  type: string;
}

export const createAccountLink = async (req: AuthenticatedRequest, res: Response) => {
  const stripeClient = new Stripe(STRIPE_SECRET_KEY.value(), {
    apiVersion: STRIPE_API_VERSION,
  });

  try {
    const uid = req.user?.uid;
    if (!uid) {
      functionsLogger.warn("createAccountLink: Usuario no autenticado.");
      res.status(401).json({ error: "No autenticado. Token de ID de Firebase válido requerido." });
      return;
    }

    const { return_url, refresh_url } = req.body as CreateAccountLinkRequestBody;

    if (!return_url || typeof return_url !== "string" || !refresh_url || typeof refresh_url !== "string") {
      functionsLogger.warn(`createAccountLink: Missing or invalid return_url/refresh_url for UID: ${uid}`);
      res.status(400).json({ error: "Missing or invalid return_url or refresh_url." });
      return;
    }

    const driverRef = db.collection("people").doc(uid);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      functionsLogger.error(`createAccountLink: Driver not found for UID: ${uid}`);
      res.status(404).json({ error: "Driver not found." });
      return;
    }

    const driverData = driverDoc.data() as DriverData;
    let stripeAccountId: string | null | undefined = driverData.stripeAccountId;

    if (!stripeAccountId) {
      functionsLogger.info(`createAccountLink: No Stripe account ID found for user ${uid}. Creating a new Connect account.`);
      try {
        const account = await stripeClient.accounts.create({
          type: "standard",
          country: "US",
          email: driverData.email,
          capabilities: {
            card_payments: { requested: true as const },
            transfers: { requested: true as const },
          },
          business_type: "individual",
          metadata: {
            firebaseUid: uid,
            platform: "YeAppDriver",
            connectOnboardingInitiated: "true"
          },
        });
        stripeAccountId = account.id;
        await driverRef.update({ stripeAccountId: stripeAccountId });
        functionsLogger.info(`createAccountLink: New Stripe Connect account created and saved for user ${uid}: ${stripeAccountId}`);
      } catch (createError: any) {
        functionsLogger.error("createAccountLink: Error creating Stripe Connect account:", createError);

        if (createError instanceof Stripe.errors.StripeError && createError.code === "account_already_exists" && createError.param === "email") {
          res.status(400).json({ error: "A Stripe account already exists for this email. Please use a different email or contact support." });
          return;
        }
        const errorMessage = (createError as Error)?.message || "Failed to create Stripe Connect account.";
        res.status(500).json({ error: errorMessage });
        return;
      }
    } else {
      functionsLogger.info(`createAccountLink: Using existing Stripe account ID for user ${uid}: ${stripeAccountId}`);

      try {
        const existingAccount = await stripeClient.accounts.retrieve(stripeAccountId);
        if (
          existingAccount.type !== "standard" ||
          existingAccount.capabilities?.card_payments !== "active" ||
          existingAccount.capabilities?.transfers !== "active"
        ) {
          functionsLogger.warn(`createAccountLink: Existing Stripe account ${stripeAccountId} for user ${uid} is not a 'standard' Connect account or does not have active capabilities. User may need re-onboarding.`);
        }
      } catch (retrieveError: any) {
        if (retrieveError instanceof Stripe.errors.StripeError && retrieveError.code === "resource_missing") {
          functionsLogger.warn(`createAccountLink: Stripe account ${stripeAccountId} for user ${uid} not found on Stripe. Resetting ID in Firestore.`);
          await driverRef.update({ stripeAccountId: FieldValue.delete() });
          stripeAccountId = null;
          res.status(500).json({ error: "Stripe account not found, please try again." });
          return;
        }
        functionsLogger.error(`createAccountLink: Error retrieving existing Stripe account ${stripeAccountId}:`, retrieveError);
        const errorMessage = (retrieveError as Error)?.message || "Failed to verify existing Stripe account.";
        res.status(500).json({ error: errorMessage });
        return;
      }
    }

    if (!stripeAccountId) {
      functionsLogger.error(`createAccountLink: No Stripe account ID available to create account link for user ${uid}.`);
      res.status(500).json({ error: "Stripe account not available to create link." });
      return;
    }

    const accountLink = await stripeClient.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refresh_url,
      return_url: return_url,
      type: "account_onboarding",
    });

    functionsLogger.info(`createAccountLink: Account link generated for ${stripeAccountId}: ${accountLink.url}`);
    res.status(200).json({ accountLink: accountLink.url });
    return;

  } catch (error: any) {
    functionsLogger.error("createAccountLink: Error in top-level catch:", error);
    if (error instanceof Stripe.errors.StripeError) {
      res.status(error.statusCode || 500).json({ error: error.message, code: error.code });
      return;
    }
    const errorMessage = (error as Error)?.message || "Failed to generate Stripe account link due to unexpected error.";
    res.status(500).json({ error: errorMessage });
    return;
  }
};

export const accountStatus = async (req: AuthenticatedRequest, res: Response) => {
  const stripeClient = new Stripe(STRIPE_SECRET_KEY.value(), {
    apiVersion: STRIPE_API_VERSION,
  });

  try {
    const uid = req.user?.uid;
    if (!uid) {
      functionsLogger.warn("accountStatus: Usuario no autenticado.");
      res.status(401).json({ error: "No autenticado. Token de ID de Firebase válido requerido." });
      return;
    }

    const driverRef = db.collection("people").doc(uid);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      functionsLogger.error(`accountStatus: Driver not found for UID: ${uid}`);
      res.status(404).json({ error: "Driver not found." });
      return;
    }

    const driverData = driverDoc.data() as DriverData;
    const stripeAccountId = driverData.stripeAccountId;

    if (!stripeAccountId) {
      functionsLogger.info(`accountStatus: Stripe account not yet created for driver UID: ${uid}`);
      res.status(400).json({ error: "Stripe account not yet created for this driver." });
      return;
    }

    const account = await stripeClient.accounts.retrieve(stripeAccountId);

    const accountStatus: AccountStatusResponse = {
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        past_due: account.requirements?.past_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        disabled_reason: account.requirements?.disabled_reason || null,
      },
      type: account.type,
    };

    functionsLogger.info(`Stripe account status for ${stripeAccountId}:`, accountStatus);
    res.status(200).json(accountStatus);
    return;

  } catch (error: any) {
    functionsLogger.error("accountStatus: Error in top-level catch:", error);
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === "account_invalid" || error.code === "resource_missing") {
        res.status(400).json({ error: "Invalid Stripe account ID or account not found. Please try re-initiating setup." });
        return;
      }
      res.status(error.statusCode || 500).json({ error: error.message, code: error.code });
      return;
    }
    const errorMessage = (error as Error)?.message || "Failed to retrieve Stripe account status.";
    res.status(500).json({ error: errorMessage });
    return;
  }
};