import { defineSecret } from "firebase-functions/params";

// Stripe Secrets
export const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
export const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

// Checkr Secrets
export const CHECKR_SECRET_KEY = defineSecret("CHECKR_SECRET_KEY");
export const CHECKR_API_URL = defineSecret("CHECKR_API_URL");
export const CHECKR_WEBHOOK_SECRET = defineSecret("CHECKR_WEBHOOK_SECRET");
