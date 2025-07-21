/* eslint-disable no-case-declarations */
import Stripe from "stripe";
import { db, firestoreFieldValue } from "../../utils/firebaseAdminConfig.js";
import { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } from "../../conf/env.js";

const STRIPE_API_VERSION = '2025-06-30.basil';


export const handleStripeWebhook = async (req, res) => {
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
  
  const stripeWebhookSecret = STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];
  let event;
  let rawBodyBuffer;

  console.log('--- STARTING WEBHOOK PROCESSING ---');
  console.log('Type of req.body initially received by Express:', typeof req.body);
  if (typeof req.body === 'object' && req.body !== null && !Buffer.isBuffer(req.body)) {
      console.log('req.body is an object, but not a Buffer. It might be already parsed JSON.');
  } else if (Buffer.isBuffer(req.body)) {
      console.log('req.body is a Buffer (raw body). Perfect!');
  } else {
      console.log('req.body is not an object or a Buffer. Type:', typeof req.body, 'Value:', req.body);
  }

  try {
    if (!stripeWebhookSecret) {
      console.error(
        "Error: STRIPE_WEBHOOK_SECRET no está configurado. No se puede verificar la firma del webhook."
      );
      return res.status(500).send("Server configuration error.");
    }

    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
        rawBodyBuffer = req.rawBody;
        console.log('Obtained raw body from req.rawBody (Buffer). Length:', rawBodyBuffer.length);
    } else {
        console.warn('req.rawBody is NOT a Buffer or is undefined. Falling back to JSON.stringify(req.body). Signature verification may fail.');
        rawBodyBuffer = Buffer.from(JSON.stringify(req.body), 'utf8');
    }

    event = stripe.webhooks.constructEvent(
      rawBodyBuffer,
      sig,
      stripeWebhookSecret
    );
  } catch (err) {
    console.error(
      `⚠️ Error al verificar la firma del webhook de Stripe: ${err.message}`
    );

    console.error('Type of payload used during error:', rawBodyBuffer ? typeof rawBodyBuffer : 'undefined');
    console.error('Is payload a Buffer?', rawBodyBuffer ? Buffer.isBuffer(rawBodyBuffer) : 'false');
    console.error('Payload content (first 200 chars, if available):', rawBodyBuffer ? rawBodyBuffer.toString('utf8').substring(0, 200) : 'N/A');

    return res.status(400).send(`Error de Webhook: ${err.message}`);
  }

  console.log('✅ Stripe Webhook Event Parsed Successfully. Type:', event.type);

  switch (event.type) {
    case "identity.verification_session.verified":
      // eslint-disable-next-line no-case-declarations
      const verifiedSession = event.data.object;
      console.log(
        "✅ Sesión de Verificación de Stripe Identity verificada:",
        verifiedSession.id
      );

      // eslint-disable-next-line no-case-declarations
      const userId = verifiedSession.metadata.userId;
      if (!userId) {
        console.error("Error: userId no encontrado en metadata para la sesión verificada.");
        return res.status(400).send("Missing userId in metadata.");
      }

      console.log('DATA:>>>>> ', verifiedSession);

      let report;
      if (verifiedSession.last_verification_report) {
        try {
          report = await stripe.identity.verificationReports.retrieve(
            verifiedSession.last_verification_report
          );
          console.log('✅ Informe de Verificación Recuperado:', report.id);
          console.log('REPORT DATA:>>>>> ', JSON.stringify(report, null, 2));
        } catch (reportError) {
          console.error(
            `Error al recuperar el Informe de Verificación ${verifiedSession.last_verification_report}:`,
            reportError
          );
          report = null;
        }
      }

      console.log('REPORT (para extracción de datos) ::::>>>> ', report ? 'Report available.' : 'No report available.');

      let fullName = "No disponible";
      let dateOfBirth = "No disponible";
      let licenseNumber = "No disponible";
      let isAgeVerified = false;
      let isLicenseExpired = null;
      let documentStatus = "unavailable";
      let documentType = "unknown";
      let identityVerifiedOverall = false;

      if (report) {
        documentType = report?.document?.type || "unknown";
        documentStatus = report?.document?.status || "unavailable";
        identityVerifiedOverall = documentStatus === 'verified';

        fullName = `${report?.document?.first_name || "No disponible"} ${report?.document?.last_name || "No disponible"}`;

        let dobFromReport = null;
        let stripeAgeCheckVerified = false;

        if (report?.age_check?.details?.dob) {
            dobFromReport = report.age_check.details.dob;
            stripeAgeCheckVerified = report.age_check.status === 'verified';
            console.log(`[UserID: ${userId}] DOB found in age_check. Stripe Age Check Status: ${report.age_check.status}`);
        } else if (report?.document?.extracted_data?.dob) {
            dobFromReport = report.document.extracted_data.dob;
            stripeAgeCheckVerified = documentStatus === 'verified';
            console.warn(`[UserID: ${userId}] No 'age_check' report. Using DOB from 'document.extracted_data'.`);
        } else {
            console.warn(`[UserID: ${userId}] Date of Birth not found in 'age_check' or 'document.extracted_data'.`);
        }

        if (dobFromReport) {
            dateOfBirth = `${dobFromReport.year}-${dobFromReport.month}-${dobFromReport.day}`;
            const dobDate = new Date(dobFromReport.year, dobFromReport.month - 1, dobFromReport.day);
            const today = new Date();
            let calculatedAge = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                calculatedAge--;
            }
            console.log(`[UserID: ${userId}] Calculated Age: ${calculatedAge} years.`);
            isAgeVerified = (calculatedAge >= 18);

            if (!isAgeVerified) {
                console.warn(`[UserID: ${userId}] Calculated age (${calculatedAge}) is less than 18. isAgeVerified set to false.`);
            } else if (dobFromReport && !stripeAgeCheckVerified) {
                console.warn(`[UserID: ${userId}] Calculated age is >= 18, but Stripe's explicit age_check was not 'verified' or not present. Setting isAgeVerified based on calculation.`);
            }
        } else {
            isAgeVerified = false;
            console.warn(`[UserID: ${userId}] No Date of Birth available to calculate age. isAgeVerified remains false.`);
        }

        if (documentType === 'driver_license') {
            licenseNumber = report?.document?.details?.id_number || "No disponible";

            const expirationDateObj = report?.document?.expiration_date;
            if (expirationDateObj && expirationDateObj.year && expirationDateObj.month && expirationDateObj.day) {
                const expirationDate = new Date(expirationDateObj.year, expirationDateObj.month - 1, expirationDateObj.day);
                const currentDate = new Date();
                isLicenseExpired = expirationDate < currentDate;
                console.log(`[UserID: ${userId}] License Expiration Date: ${expirationDate.toISOString().substring(0, 10)}, Current Date: ${currentDate.toISOString().substring(0, 10)}. Is License Expired: ${isLicenseExpired}.`);
            } else {
                console.warn(`[UserID: ${userId}] License expiration date not found or incomplete in report for driver_license. Setting isLicenseExpired to null.`);
            }
        } else {
            licenseNumber = report?.id_number?.id_number || "No disponible (documento no es licencia de conducir)";
            console.warn(`[UserID: ${userId}] Document type is not 'driver_license' (${documentType}). Cannot perform license expiration check.`);
            isLicenseExpired = null;
        }

        console.log(`[UserID: ${userId}] Final Validation Results:`);
        console.log(` - Full Name: ${fullName}`);
        console.log(` - Date of Birth: ${dateOfBirth}`);
        console.log(` - License Number: ${licenseNumber}`);
        console.log(` - Is Age Verified (>=18): ${isAgeVerified}`);
        console.log(` - Is License Expired: ${isLicenseExpired === true ? 'Yes' : (isLicenseExpired === false ? 'No' : 'N/A (Not Driver License/Info Missing)')}`);
        console.log(` - Document Status (overall): ${documentStatus}`);
        console.log(` - Document Type: ${documentType}`);
        console.log(` - Overall Identity Verified (from Stripe report): ${identityVerifiedOverall}`);

      } else {
          console.error(`[UserID: ${userId}] No verification report available, all identity fields set to 'No disponible'. Identity and License NOT verified.`);
      }

      const isDriverLicenseVerified =
          (documentType === 'driver_license') && 
          (documentStatus === 'verified') &&
          isAgeVerified &&
          (isLicenseExpired === false);

      try {
        await db
          .collection("users")
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
                lastVerifiedAt: firestoreFieldValue.serverTimestamp(),
                verificationAttempts: firestoreFieldValue.increment(1),
                identityVerified: identityVerifiedOverall,
                licenseVerified: true,  // cambiar en produccion a  isDriverLicenseVerified
              },
            },
            { merge: true }
          );

        console.log(
          `Estado de verificación de usuario ${userId} actualizado en Firestore. License Verified: ${isDriverLicenseVerified}.`
        );
      } catch (dbError) {
        console.error(
          "Error al actualizar el estado de verificación del usuario en Firestore:",
          dbError
        );
      }
      break;

    case "identity.verification_session.requires_input":
      const requiresInputSession = event.data.object;
      console.log(
        "🟡 Sesión de Verificación de Stripe Identity requiere entrada:",
        requiresInputSession.id
      );
      try {
        const userId = requiresInputSession.metadata.userId;
        if (!userId) {
          console.error("Error: userId no encontrado en metadata para la sesión requiring input.");
          return res.status(400).send("Missing userId in metadata.");
        }
        await db
          .collection("users")
          .doc(userId)
          .set(
            {
              stripeIdentity: {
                status: "requires_input",
                sessionId: requiresInputSession.id,
                lastVerifiedAt: firestoreFieldValue.serverTimestamp(),
                verificationAttempts: firestoreFieldValue.increment(1),
                identityVerified: false,
                licenseVerified: false
              },
            },
            { merge: true }
          );
        console.log(
          `Estado de verificación de usuario ${userId} actualizado a 'requires_input'.`
        );
      } catch (dbError) {
        console.error(
          'Error al actualizar el estado de usuario a "requires_input":',
          dbError
        );
      }
      break;

    case "identity.verification_session.canceled":
      const canceledSession = event.data.object;
      console.log(
        "🔴 Sesión de Verificación de Stripe Identity cancelada:",
        canceledSession.id
      );
      try {
        const userId = canceledSession.metadata.userId;
        if (!userId) {
          console.error("Error: userId no encontrado en metadata para la sesión cancelada.");
          return res.status(400).send("Missing userId in metadata.");
        }
        await db
          .collection("users")
          .doc(userId)
          .set(
            {
              stripeIdentity: {
                status: "canceled",
                sessionId: canceledSession.id,
                lastVerifiedAt: firestoreFieldValue.serverTimestamp(),
                verificationAttempts: firestoreFieldValue.increment(1),
                identityVerified: false,
                licenseVerified: false
              },
            },
            { merge: true }
          );
        console.log(
          `Estado de verificación de usuario ${userId} actualizado a 'canceled'.`
        );
      } catch (dbError) {
        console.error(
          'Error al actualizar el estado de usuario a "canceled":',
          dbError
        );
      }
      break;

    case "identity.verification_session.created":
        const createdSession = event.data.object;
        console.log(
            "🔵 Sesión de Verificación de Stripe Identity creada (sin verificar):",
            createdSession.id
        );
        break;

    default:
      console.log(
        `Tipo de evento de webhook de Stripe no manejado: ${event.type}`
      );
  }

  res.json({ received: true });
};