import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { CHECKR_WEBHOOK_SECRET } from "../../conf/env.js";

const db = getFirestore();

// @ts-ignore
export const checkrWebhook = functions.https.onRequest(async (req, res) => {
  console.log("Webhook recibido de Checkr.");

  if (req.method !== 'POST') {
    console.log("Método no permitido:", req.method);
    return res.status(405).send('Method Not Allowed');
  }

  const signatureHeader = req.headers['x-checkr-signature'];
  const signature = typeof signatureHeader === 'string' ? signatureHeader : '';
  if (!signature) {
    console.log("Missing X-Checkr-Signature header in webhook.");
    return res.status(401).send('Unauthorized: Missing signature');
  }

  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', CHECKR_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.log(`Webhook signature mismatch. Expected: ${expectedSignature}, Received: ${signature}`);
    return res.status(403).send('Invalid signature.');
  }

  console.log("Checkr webhook signature verified successfully.");

  let event;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (parseError) {
    console.log("Error parsing JSON body:", parseError);
    return res.status(400).send("Malformed JSON in request body.");
  }

  const report = event.data?.object;
  const reportId = report?.id;
  const reportStatus = report?.status;
  const reportResult = report?.result;
  const eventType = event.type;

  console.log(`Received Checkr event: ${eventType} for report ${reportId}`);
  console.log("Payload recibido de Checkr (data.object):", JSON.stringify(report, null, 2));
  console.log("reportStatus:", reportStatus);
  console.log("reportResult:", reportResult);

  if (!reportId) {
    console.log("Invalid event structure: reportId missing.", event);
    return res.status(400).send("Invalid event structure.");
  }

  if (['report.completed', 'report.adjudicated'].includes(eventType)) {
    console.log(`Entrando en el bloque de procesamiento para eventType: ${eventType}`);
    try {
      const checkrDataSnapshot = await db
        .collection('checkrData')
        .where('checkrReportId', '==', reportId)
        .limit(1)
        .get();

      if (checkrDataSnapshot.empty) {
        functions.logger.warn(`No checkrData document found for report ID: ${reportId}.`);
        return res.status(200).send('CheckrData document not found, but webhook processed.');
      }

      const checkrDoc = checkrDataSnapshot.docs[0];
      const checkrDocData = checkrDoc.data();
      let userId = checkrDocData.userId; 

      // Si el userId original de checkrData tuviera el punto, esta línea lo limpiaría.
      if (typeof userId === 'string') {
          userId = userId.trim().replace(/\.$/, ''); 
      }

      console.log(`checkrData document encontrado. userId obtenido: ${userId}, Documento ID de checkrData: ${checkrDoc.id}`);

      let backgroundCheckPassed = false;
      if (reportResult === 'clear') {
        const mvr = report.motor_vehicle_record;
        // @ts-ignore
        backgroundCheckPassed = !mvr?.summary?.adverse_action_required ?? true;
        console.log(`reportResult es 'clear'. MVR adverse action required: ${mvr?.summary?.adverse_action_required}. backgroundCheckPassed (final): ${backgroundCheckPassed}`);
      } else if (reportResult === 'consider') {
        backgroundCheckPassed = false;
        console.log(`reportResult es 'consider'. backgroundCheckPassed: ${backgroundCheckPassed}`);
      } else {
        console.log(`reportResult es '${reportResult}'. Estableciendo backgroundCheckPassed a false por defecto.`);
        backgroundCheckPassed = false;
      }
      
      const updateCheckrData: any = {
        status: reportStatus,
        result: reportResult,
        passed: backgroundCheckPassed, 
        updatedAt: new Date(),
        eventType: eventType,
      };

      await checkrDoc.ref.update(updateCheckrData);
      console.log(`Firestore checkrData actualizado para user ${userId}. Datos: ${JSON.stringify(updateCheckrData)}`);
      console.log(`Preparando búsqueda en driverOnBoardingProgress para userId: '${userId}'`);

      // *** VOLVEMOS AL MÉTODO DE BÚSQUEDA POR CAMPO 'userId' ***
      const driverOnBoardingProgressSnapshot = await db
        .collection('driverOnBoardingProgress')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (driverOnBoardingProgressSnapshot.empty) {
        functions.logger.warn(`No driverOnBoardingProgress document found for userId: ${userId}.`);
        // Si solo quieres ACTUALIZAR, este return es correcto.
        // Si no existe, no lo creará.
        return res.status(200).send('driverOnBoardingProgress document not found for update, webhook processed partially.');
      }

      const driverOnBoardingProgressDoc = driverOnBoardingProgressSnapshot.docs[0];
      const updatedriverOnBoardingProgress: any = {
        criminalRecords: true, 
        updatedAt: new Date(),
      };
      
      console.log(`Intentando actualizar driverOnBoardingProgress para userId: ${userId} (ID de documento encontrado: ${driverOnBoardingProgressDoc.id}) con criminalRecords: ${backgroundCheckPassed}`);
      await driverOnBoardingProgressDoc.ref.update(updatedriverOnBoardingProgress); 
      console.log(`Firestore driverOnBoardingProgress actualizado exitosamente para user ${userId}.`);

      return res.status(200).send('Webhook processed and Firestore updated.');
    } catch (error) {
      console.log(`Error processing Checkr report ${reportId}:`, error);
      return res.status(500).send('Internal Server Error during processing.');
    }
  }

  console.log(`Evento ${eventType} recibido, pero no procesado por esta función (no es 'report.completed' o 'report.adjudicated').`);
  return res.status(200).send('Event received, but not processed.');
});