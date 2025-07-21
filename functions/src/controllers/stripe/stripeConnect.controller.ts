import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../conf/env.js";

const db = getFirestore();

const STRIPE_API_VERSION = "2025-06-30.basil";

export const createAccountLink = async (req, res) => {
  const stripeClient = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
  try {
    const uid = req.user.uid;
    const { return_url, refresh_url } = req.body;

    if (!return_url || !refresh_url) {
      return res
        .status(400)
        .json({ error: "Missing return_url or refresh_url." });
    }

    const driverRef = db.collection("users").doc(uid);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      functions.logger.error(`Driver not found for UID: ${uid}`);
      return res.status(404).json({ error: "Driver not found." });
    }

    const driverData = driverDoc.data();
    let stripeAccountId = driverData.stripeAccountId;

    if (!stripeAccountId) {
      functions.logger.info(
        `No Stripe account ID found for user ${uid}. Creating a new Connect account.`
      );
      try {
        // @ts-ignore
        const account = await stripeClient.accounts.create({
          type: "standard",
          country: "US",
          email: driverData.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual",
          metadata: {
            firebaseUid: uid,
            platform: "YeAppDriver",
            connectOnboardingInitiated: true,
          },
        });
        stripeAccountId = account.id;
        await driverRef.update({ stripeAccountId: stripeAccountId });
        functions.logger.info(
          `New Stripe Connect account created and saved for user ${uid}: ${stripeAccountId}`
        );
      } catch (createError) {
        functions.logger.error(
          "Error creating Stripe Connect account:",
          createError
        );

        if (
          createError.code === "account_already_exists" &&
          createError.param === "email"
        ) {
          return res
            .status(400)
            .json({
              error:
                "A Stripe account already exists for this email. Please use a different email or contact support.",
            });
        }
        return res
          .status(500)
          .json({ error: "Failed to create Stripe Connect account." });
      }
    } else {
      functions.logger.info(
        `Using existing Stripe account ID for user ${uid}: ${stripeAccountId}`
      );

      try {
        const existingAccount = await stripeClient.accounts.retrieve(
          stripeAccountId
        );
        // @ts-ignore
        if (
          existingAccount.type !== "standard" ||
          // @ts-ignore
          !existingAccount.capabilities.card_payments?.requested ||
          // @ts-ignore
          !existingAccount.capabilities.transfers?.requested
        ) {
          functions.logger.warn(
            `Existing Stripe account ${stripeAccountId} for user ${uid} is not a 'standard' Connect account or is missing capabilities. User may need re-onboarding.`
          );
        }
      } catch (retrieveError) {
        if (retrieveError.raw.code === "resource_missing") {
          functions.logger.warn(
            `Stripe account ${stripeAccountId} for user ${uid} not found on Stripe. Resetting ID.`
          );
          await driverRef.update({
            stripeAccountId: admin.firestore.FieldValue.delete(),
          });
          stripeAccountId = null;
          return res
            .status(500)
            .json({ error: "Stripe account not found, please try again." });
        }
        functions.logger.error(
          `Error retrieving existing Stripe account ${stripeAccountId}:`,
          retrieveError
        );
        return res
          .status(500)
          .json({ error: "Failed to verify existing Stripe account." });
      }
    }

    if (!stripeAccountId) {
      functions.logger.error(
        `No Stripe account ID available to create account link for user ${uid}.`
      );
      return res
        .status(500)
        .json({ error: "Stripe account not available to create link." });
    }

    const accountLink = await stripeClient.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refresh_url,
      return_url: return_url,
      type: "account_onboarding",
    });

    functions.logger.info(
      `Account link generated for ${stripeAccountId}: ${accountLink.url}`
    );
    return res.status(200).json({ accountLink: accountLink.url });
  } catch (error) {
    functions.logger.error(
      "Error in createAccountLink (top-level catch):",
      error
    );
    if (
      error.type === "StripeCardError" ||
      error.type === "StripeInvalidRequestError"
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res
      .status(500)
      .json({
        error:
          "Failed to generate Stripe account link due to unexpected error.",
      });
  }
};

export const accountStatus = async (req, res) => {
  try {
    const stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    });
    const uid = req.user.uid;

    const driverRef = db.collection("users").doc(uid);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      functions.logger.error(`Driver not found for UID: ${uid}`);
      return res.status(404).json({ error: "Driver not found." });
    }

    const driverData = driverDoc.data();
    const stripeAccountId = driverData.stripeAccountId;

    if (!stripeAccountId) {
      return res
        .status(400)
        .json({ error: "Stripe account not yet created for this driver." });
    }

    // @ts-ignore
    const account = await stripeClient.accounts.retrieve(stripeAccountId);

    const accountStatus = {
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

    functions.logger.info(
      `Stripe account status for ${stripeAccountId}:`,
      accountStatus
    );
    return res.status(200).json(accountStatus);
  } catch (error) {
    functions.logger.error("Error in accountStatus (top-level catch):", error);
    if (
      error.type === "StripeInvalidRequestError" &&
      error.code === "account_invalid"
    ) {
      return res
        .status(400)
        .json({
          error: "Invalid Stripe account ID. Please try re-initiating setup.",
        });
    }
    return res
      .status(500)
      .json({
        error: error.message || "Failed to retrieve Stripe account status.",
      });
  }
};
