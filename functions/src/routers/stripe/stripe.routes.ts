import express, { Router } from "express";
import { createVerificationSession } from "../../controllers/stripe/stripe.controller.js";
import { handleStripeWebhook } from "../../controllers/stripe/webhookStripe.controller.js";
import authenticateFirebaseToken from "../../middleware/authenticateFirebaseToken";
import { createApiCostsPaymentIntent } from "../../controllers/stripe/createPayment.controller.js";
import { verifyApiCostsPaymentStatus } from "../../controllers/stripe/verifyPayment.controller.js";
import {
  accountStatus,
  createAccountLink,
} from "../../controllers/stripe/stripeConnect.controller.js";

const router = Router();

router.post("/verify", express.json(), createVerificationSession);
router.post("/webhook", handleStripeWebhook);
router.post(
  "/api-payments/create-intent",
  authenticateFirebaseToken,
  createApiCostsPaymentIntent
);
router.post(
  "/api-payments/verify-status",
  authenticateFirebaseToken,
  verifyApiCostsPaymentStatus
);
router.post(
  "/connect/create-account-link",
  authenticateFirebaseToken,
  express.json(),
  createAccountLink
);
router.post(
  "/connect/account-status",
  authenticateFirebaseToken,
  express.json(),
  accountStatus
);

export default router;
