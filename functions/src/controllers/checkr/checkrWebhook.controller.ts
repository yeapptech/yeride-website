import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { CHECKR_WEBHOOK_SECRET } from "../../conf/env.js";

const db = getFirestore();

// @ts-ignore
export const checkrWebhook = functions.https.onRequest(async (req, res) => {
  functions.logger.info("Webhook recibido de Checkr.");

  if (req.method !== 'POST') {
    functions.logger.warn(`Método ${req.method} no permitido para el webhook de Checkr.`);
    return res.status(405).send('Method Not Allowed');
  }

  const signatureHeader = req.headers['x-checkr-signature'];
  const signature = typeof signatureHeader === 'string' ? signatureHeader : '';
  if (!signature) {
    functions.logger.error("Missing X-Checkr-Signature header in webhook.");
    return res.status(401).send('Unauthorized: Missing signature');
  }

  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', CHECKR_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    functions.logger.error(`Webhook signature mismatch. Expected: ${expectedSignature}, Received: ${signature}`);
    return res.status(403).send('Invalid signature.');
  }

  functions.logger.info("Checkr webhook signature verified successfully.");

  let event;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (parseError) {
    functions.logger.error("Error parsing JSON body:", parseError);
    return res.status(400).send("Malformed JSON in request body.");
  }

  if (!event || !event.data || !event.data.object || !event.data.object.id) {
    functions.logger.error("Invalid event structure received (missing data.object.id):", event);
    return res.status(400).send("Invalid event structure.");
  }

  const report = event.data.object;
  const reportId = report.id;
  const reportStatus = report.status;
  const reportResult = report.result;
  const middleName = report.middle_name || null;
  const ssn = report.ssn_last_4 || null;
  const driverLicenseNumber = report.license_number || null;
  const driverLicenseState = report.license_state || null;
  const driverLicenseCountry = report.license_country || null;

  functions.logger.info(`Received Checkr event: ${event.type} for report ${reportId}`);
  functions.logger.info("Payload recibido de Checkr:", JSON.stringify(report, null, 2));

  if (['report.completed', 'report.adjudicated'].includes(event.type)) {
    try {
      const usersSnapshot = await db
        .collection('users')
        .where('checkrReportId', '==', reportId)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        functions.logger.warn(`No user found for Checkr report ID: ${reportId}`);
        return res.status(200).send('User not found for this report, but webhook processed.');
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      let backgroundCheckPassed = false;
      if (reportResult === 'clear') {
        const mvr = report.motor_vehicle_record;
        backgroundCheckPassed = !mvr?.summary?.adverse_action_required;
      } else if (reportResult === 'consider') {
        backgroundCheckPassed = false;
      }

      await userDoc.ref.update({
        checkrData: {
          status: reportStatus,
          result: reportResult,
          passed: backgroundCheckPassed,
          middleName: middleName,
          ssn: ssn,
          driverLicenseNumber: driverLicenseNumber,
          driverLicenseState: driverLicenseState,
          driverLicenseCountry: driverLicenseCountry,
          updatedAt: new Date(), 
        },
      });

      functions.logger.info(`Firestore updated for user ${userId}. checkrData: Status=${reportStatus}, Result=${reportResult}, Passed=${backgroundCheckPassed}`);
      return res.status(200).send('Checkr webhook processed and Firestore updated.');
    } catch (error) {
      functions.logger.error(`Error processing Checkr report ${reportId} for user:`, error);
      return res.status(500).send('Internal Server Error during processing Checkr webhook.');
    }
  }
  return res.status(200).send('Event received, but not processed (unhandled event type).');
});