import { Response } from "express";
import * as functionsLogger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";
import { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } from "../../conf/env.js";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const STRIPE_API_VERSION = "2025-06-30.basil";

interface VerificationSessionMetadata {
  userId?: string;
}

interface DateDetails {
  day: number | null;
  month: number | null;
  year: number | null;
}

type CustomVerificationReportDocument = Omit<
  Stripe.Identity.VerificationReport.Document,
  "address" | "error" | "files" | "issued_date" | "issuing_country"
> & {
  type: string | null;
  status: string | null;
  first_name: string | null;
  last_name: string | null;
  expiration_date: DateDetails | null;
  details?: {
    id_number?: string | null;
  };
  extracted_data?: {
    dob?: DateDetails | null;
  };
};

interface CustomAgeCheck {
  status: string;
  details?: {
    dob?: DateDetails | null;
  };
}

interface VerificationReport extends Omit<Stripe.Identity.VerificationReport, "document" | "age_check" | "id_number"> {
  document?: CustomVerificationReportDocument;
  age_check?: CustomAgeCheck;
  id_number?: {
    id_number?: string | null;
  };
}

interface VerificationSession extends Omit<Stripe.Identity.VerificationSession, "last_verification_report" | "metadata"> {
  metadata: VerificationSessionMetadata;
  last_verification_report?: string | null;
}

export const handleStripeWebhook = async (req: any, res: Response) => {
  const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
    apiVersion: STRIPE_API_VERSION,
  });

  const stripeWebhookSecret = STRIPE_WEBHOOK_SECRET.value();
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;
  let rawBodyBuffer: Buffer;

  try {
    if (!stripeWebhookSecret) {
      functionsLogger.error(
        "Error: STRIPE_WEBHOOK_SECRET no está configurado. No se puede verificar la firma del webhook."
      );
      res.status(500).send("Server configuration error.");
      return;
    }

    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      rawBodyBuffer = req.rawBody;
    } else {
      functionsLogger.warn("req.rawBody is NOT a Buffer or is undefined. Falling back to JSON.stringify(req.body). Signature verification may fail.");
      rawBodyBuffer = Buffer.from(JSON.stringify(req.body), "utf8");
    }

    if (!sig) {
      functionsLogger.error("Error: Falta la cabecera 'stripe-signature'.");
      res.status(400).send("No Stripe signature header.");
      return;
    }

    event = stripe.webhooks.constructEvent(
      rawBodyBuffer,
      sig,
      stripeWebhookSecret
    );
  } catch (err: any) {
    functionsLogger.error(
      `⚠️ Error al verificar la firma del webhook de Stripe: ${(err as Error).message}`
    );

    res.status(400).send(`Error de Webhook: ${(err as Error).message}`);
    return;
  }

  switch (event.type) {
    case "identity.verification_session.verified": {
      const verifiedSession = event.data.object as VerificationSession;
      functionsLogger.log(
        "✅ Sesión de Verificación de Stripe Identity verificada:",
        verifiedSession.id
      );

      const userId = verifiedSession.metadata.userId;
      if (!userId) {
        functionsLogger.error("Error: userId no encontrado en metadata para la sesión verificada.");
        res.status(400).send("Missing userId in metadata.");
        return;
      }

      let report: VerificationReport | null = null;
      if (verifiedSession.last_verification_report) {
        try {
          report = await stripe.identity.verificationReports.retrieve(
            verifiedSession.last_verification_report
          ) as VerificationReport;
        } catch (reportError: any) {
          functionsLogger.error(
            `Error al recuperar el Informe de Verificación ${verifiedSession.last_verification_report}:`,
            reportError
          );
          report = null;
        }
      }

      let fullName = "No disponible";
      let dateOfBirth = "No disponible";
      let licenseNumber = "No disponible";
      let isAgeVerified = false;
      let isLicenseExpired: boolean | null = null;
      let documentStatus = "unavailable";
      let documentType = "unknown";
      let identityVerifiedOverall = false;

      if (report) {
        documentType = report.document?.type || "unknown";
        documentStatus = report.document?.status || "unavailable";
        identityVerifiedOverall = documentStatus === "verified";

        fullName = `${report.document?.first_name || "No disponible"} ${report.document?.last_name || "No disponible"}`;

        let dobFromReport: { year: number | null; month: number | null; day: number | null } | null = null;
        let stripeAgeCheckVerified = false;

        if (report.age_check?.details?.dob) {
          dobFromReport = report.age_check.details.dob;
          stripeAgeCheckVerified = report.age_check.status === "verified";
          functionsLogger.log(`[UserID: ${userId}] DOB found in age_check. Stripe Age Check Status: ${report.age_check.status}`);
        } else if (report.document?.extracted_data?.dob) {
          dobFromReport = report.document.extracted_data.dob;
          stripeAgeCheckVerified = documentStatus === "verified";
          functionsLogger.warn(`[UserID: ${userId}] No 'age_check' report. Using DOB from 'document.extracted_data'.`);
        } else {
          functionsLogger.warn(`[UserID: ${userId}] Date of Birth not found in 'age_check' or 'document.extracted_data'.`);
        }

        if (dobFromReport && dobFromReport.year && dobFromReport.month && dobFromReport.day) {
          dateOfBirth = `${dobFromReport.year}-${dobFromReport.month}-${dobFromReport.day}`;
          const dobDate = new Date(dobFromReport.year, dobFromReport.month - 1, dobFromReport.day);
          const today = new Date();
          let calculatedAge = today.getFullYear() - dobDate.getFullYear();
          const m = today.getMonth() - dobDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            calculatedAge--;
          }
          functionsLogger.log(`[UserID: ${userId}] Calculated Age: ${calculatedAge} years.`);
          isAgeVerified = (calculatedAge >= 18);

          if (!isAgeVerified) {
            functionsLogger.warn(`[UserID: ${userId}] Calculated age (${calculatedAge}) is less than 18. isAgeVerified set to false.`);
          } else if (dobFromReport && !stripeAgeCheckVerified) {
            functionsLogger.warn(`[UserID: ${userId}] Calculated age is >= 18, but Stripe's explicit age_check was not 'verified' or not present. Setting isAgeVerified based on calculation.`);
          }
        } else {
          isAgeVerified = false;
          functionsLogger.warn(`[UserID: ${userId}] No Date of Birth available to calculate age. isAgeVerified remains false.`);
        }

        if (documentType === "driver_license") {
          licenseNumber = report.document?.details?.id_number || "No disponible";

          const expirationDateObj = report.document?.expiration_date;
          if (expirationDateObj && expirationDateObj.year && expirationDateObj.month && expirationDateObj.day) {
            const expirationDate = new Date(expirationDateObj.year, expirationDateObj.month - 1, expirationDateObj.day);
            const currentDate = new Date();
            isLicenseExpired = expirationDate < currentDate;
            functionsLogger.log(`[UserID: ${userId}] License Expiration Date: ${expirationDate.toISOString().substring(0, 10)}, Current Date: ${currentDate.toISOString().substring(0, 10)}. Is License Expired: ${isLicenseExpired}.`);
          } else {
            functionsLogger.warn(`[UserID: ${userId}] License expiration date not found or incomplete in report for driver_license. Setting isLicenseExpired to null.`);
          }
        } else {
          licenseNumber = report.id_number?.id_number || "No disponible (documento no es licencia de conducir)";
          functionsLogger.warn(`[UserID: ${userId}] Document type is not 'driver_license' (${documentType}). Cannot perform license expiration check.`);
          isLicenseExpired = null;
        }
      }

      const isDriverLicenseVerified =
          (documentType === "driver_license") &&
          (documentStatus === "verified") &&
          isAgeVerified &&
          (isLicenseExpired === false);

      try {
        await db
          .collection("people")
          .doc(userId)
          .set(
            {
              stripeIdentity: {
                status: verifiedSession.status,
                sessionId: verifiedSession.id,
                fullName: fullName,
                dateOfBirth: dateOfBirth,
                licenseNumber: licenseNumber,
                isAgeVerified: isAgeVerified,
                isLicenseExpired: isLicenseExpired,
                documentStatus: documentStatus,
                documentType: documentType,
                lastVerifiedAt: FieldValue.serverTimestamp(),
                verificationAttempts: FieldValue.increment(1),
                identityVerified: identityVerifiedOverall,
                licenseVerified: true,
              },
            },
            { merge: true }
          );

        functionsLogger.log(
          `Estado de verificación de usuario ${userId} actualizado en Firestore. License Verified: ${isDriverLicenseVerified}.`
        );
      } catch (dbError: any) {
        functionsLogger.error(
          "Error al actualizar el estado de verificación del usuario en Firestore:",
          dbError
        );
      }
      break;
    }

    case "identity.verification_session.requires_input": {
      const requiresInputSession = event.data.object as VerificationSession;
      functionsLogger.log(
        "🟡 Sesión de Verificación de Stripe Identity requiere entrada:",
        requiresInputSession.id
      );
      try {
        const userId = requiresInputSession.metadata.userId;
        if (!userId) {
          functionsLogger.error("Error: userId no encontrado en metadata para la sesión requiring input.");
          res.status(400).send("Missing userId in metadata.");
          return;
        }
        await db
          .collection("people")
          .doc(userId)
          .set(
            {
              stripeIdentity: {
                status: "requires_input",
                sessionId: requiresInputSession.id,
                lastVerifiedAt: FieldValue.serverTimestamp(),
                verificationAttempts: FieldValue.increment(1),
                identityVerified: false,
                licenseVerified: false
              },
            },
            { merge: true }
          );
        functionsLogger.log(
          `Estado de verificación de usuario ${userId} actualizado a 'requires_input'.`
        );
      } catch (dbError: any) {
        res.status(400).send({ error: dbError, message: "som"});
      }
      break;
    }

    case "identity.verification_session.canceled": {
      const canceledSession = event.data.object as VerificationSession;
      functionsLogger.log(
        "🔴 Sesión de Verificación de Stripe Identity cancelada:",
        canceledSession.id
      );
      try {
        const userId = canceledSession.metadata.userId;
        if (!userId) {
          functionsLogger.error("Error: userId no encontrado en metadata para la sesión cancelada.");
          res.status(400).send("Missing userId in metadata.");
          return;
        }
        await db
          .collection("people")
          .doc(userId)
          .set(
            {
              stripeIdentity: {
                status: "canceled",
                sessionId: canceledSession.id,
                lastVerifiedAt: FieldValue.serverTimestamp(),
                verificationAttempts: FieldValue.increment(1),
                identityVerified: false,
                licenseVerified: false
              },
            },
            { merge: true }
          );
        functionsLogger.log(
          `Estado de verificación de usuario ${userId} actualizado a 'canceled'.`
        );
      } catch (dbError: any) {
        functionsLogger.error(
          "Error al actualizar el estado de usuario a \"canceled\":",
          dbError
        );
      }
      break;
    }

    case "identity.verification_session.created": {
      const createdSession = event.data.object as VerificationSession;
      functionsLogger.log(
        "🔵 Sesión de Verificación de Stripe Identity creada (sin verificar):",
        createdSession.id
      );
      break;
    }

    default:
      functionsLogger.log(
        `Tipo de evento de webhook de Stripe no manejado: ${event.type}`
      );
  }

  res.json({ received: true });
};