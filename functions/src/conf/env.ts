export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as
  | string
  | undefined;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as
  | string
  | undefined;

export const CHECKR_SECRET_KEY = process.env.CHECKR_SECRET_KEY as
  | string
  | undefined;
export const CHECKR_API_URL = process.env.CHECKR_API_URL as string | undefined;
export const CHECKR_WEBHOOK_SECRET = process.env.CHECKR_WEBHOOK_SECRET as
  | string
  | undefined;

export const APP_URL_SERVICE_API = process.env.APP_URL_SERVICE_API as
  | string
  | undefined;
export const APP_RETURN_URL = process.env.APP_RETURN_URL as string | undefined;

export function checkFirebaseConfigVariables() {
  const requiredVars = [
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    CHECKR_SECRET_KEY,
    CHECKR_API_URL,
    CHECKR_WEBHOOK_SECRET,
    APP_URL_SERVICE_API,
    APP_RETURN_URL,
  ];
  if (requiredVars.some((v) => typeof v === "undefined" || v === null)) {
    console.warn(
      "¡Advertencia! Algunas variables de entorno esenciales no están definidas en Firebase Functions config. Asegúrate de haberlas establecido con `firebase functions:config:set`."
    );
  }
}
