import * as functionsLogger from "firebase-functions/logger";
import * as crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { CHECKR_WEBHOOK_SECRET } from "../../conf/env.js";

const db = getFirestore();

export const checkrWebhook = async (req: any, res: any) => {
  functionsLogger.info("Webhook recibido de Checkr.");

  if (req.method !== "POST") {
    functionsLogger.warn(`Método ${req.method} no permitido para el webhook de Checkr.`);
    return res.status(405).send("Method Not Allowed");
  }

  const signatureHeader = req.headers["x-checkr-signature"];
  const signature = typeof signatureHeader === "string" ? signatureHeader : "";
  if (!signature) {
    functionsLogger.error("Missing X-Checkr-Signature header in webhook.");
    return res.status(401).send("Unauthorized: Missing signature");
  }

  if (!req.rawBody) {
    functionsLogger.error("req.rawBody is missing. Cannot verify signature. Ensure bodyParser.raw is used.");
    return res.status(500).send("Internal Server Error: Raw body not available.");
  }
  const rawBody = req.rawBody.toString("utf8");

  const checkrWebhookSecret = CHECKR_WEBHOOK_SECRET.value();
  if (!checkrWebhookSecret) {
    functionsLogger.error("CHECKR_WEBHOOK_SECRET is not configured. Cannot verify signature.");
    return res.status(500).send("Server configuration error.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", checkrWebhookSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    functionsLogger.error(`Webhook signature mismatch. Expected: ${expectedSignature}, Received: ${signature}`);
    return res.status(403).send("Invalid signature.");
  }

  functionsLogger.info("Checkr webhook signature verified successfully.");

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (parseError) {
    functionsLogger.error("Error parsing JSON body from rawBody:", parseError);
    return res.status(400).send("Malformed JSON in request body.");
  }

  if (!event?.data?.object?.id) {
    functionsLogger.error("Invalid event structure received:", event);
    return res.status(400).send("Invalid event structure.");
  }

  const report = event.data.object;
  const reportId = report.id;
  const reportStatus = report.status;
  const reportResult = report.result;

  functionsLogger.info(`Received Checkr event: ${event.type} for report ${reportId}`);
  functionsLogger.info("Payload recibido de Checkr:", JSON.stringify(report, null, 2));

  if (["report.completed", "report.adjudicated"].includes(event.type)) {
    try {
      const peopleSnapshot = await db
        .collection("people")
        .where("checkrReportId", "==", reportId)
        .limit(1)
        .get();

      if (peopleSnapshot.empty) {
        functionsLogger.warn(`No driver found for report ID: ${reportId}`);
        return res.status(200).send("Driver not found, but webhook processed.");
      }

      const driverDoc = peopleSnapshot.docs[0];
      const driverUid = driverDoc.id;

      let backgroundCheckPassed = false;
      if (reportResult === "clear") {
        const mvr = report.motor_vehicle_record;
        backgroundCheckPassed = !mvr?.summary?.adverse_action_required;
      } else if (reportResult === "consider") {
        backgroundCheckPassed = false;
      }

      await driverDoc.ref.update({
        backgroundCheckStatus: reportStatus,
        backgroundCheckResult: reportResult,
        backgroundCheckPassed,
        backgroundCheckDetails: {
          status: reportStatus,
          result: reportResult,
          timestamp: new Date(),
          eventType: event.type,
        },
      });

      functionsLogger.info(`Firestore updated for driver ${driverUid}. Status: ${reportStatus}, Result: ${reportResult}, Passed: ${backgroundCheckPassed}`);
      return res.status(200).send("Webhook processed and Firestore updated.");
    } catch (error) {
      functionsLogger.error(`Error processing Checkr report ${reportId}:`, error);
      return res.status(500).send("Internal Server Error during processing.");
    }
  }

  return res.status(200).send("Event received, but not processed.");
};