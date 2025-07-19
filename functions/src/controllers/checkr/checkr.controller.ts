import axios, { isAxiosError }  from "axios";
import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";
import { CHECKR_SECRET_KEY, CHECKR_API_URL } from "../../conf/env.js";

const db = getFirestore();


export const startBackgroundCheck = async (req: any, res: any) => {
  const checkrApi = axios.create({
    baseURL: CHECKR_API_URL.value(),
    headers: {
      Authorization: `Basic ${Buffer.from(`${CHECKR_SECRET_KEY.value()}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });
  try {
    if (!CHECKR_SECRET_KEY || !CHECKR_API_URL.value()) {
      return res.status(500).json({ error: "Configuración del servicio de verificación de antecedentes incompleta." });
    }

    const uid = req.user.uid;
    const {
      first_name,
      last_name,
      middle_name,
      dob,
      ssn,
      driver_license_number,
      driver_license_state,
      driver_license_country,
    } = req.body;

    if (!first_name || !last_name || !middle_name || !dob || !ssn || !driver_license_number || !driver_license_state || !driver_license_country) {
      functions.logger.warn("Missing required candidate information for background check.", { uid, body: req.body });
      return res.status(400).json({ error: "Faltan datos obligatorios para la verificación de antecedentes." });
    }

    const driverRef = db.collection("people").doc(uid);
    const driverDoc = await driverRef.get();
    if (!driverDoc.exists) {
      functions.logger.error(`Driver not found for UID: ${uid}`);
      return res.status(404).json({ error: "Conductor no encontrado." });
    }

    const driverData = driverDoc.data();
    functions.logger.info("Driver data retrieved:", driverData);

    functions.logger.info("Attempting to create Checkr candidate...");
    const candidateRes = await checkrApi.post("/candidates", {
      first_name,
      last_name,
      middle_name,
      dob,
      ssn,
      email: driverData?.email,
      phone: driverData?.phoneNumber,
      zipcode: driverData?.address?.zipCode || "90210",
    });
    const candidate = candidateRes.data;
    functions.logger.info("Checkr candidate created:", candidate.id);

    functions.logger.info("Attempting to create Checkr report...");
    const reportRes = await checkrApi.post("/reports", {
      candidate_id: candidate.id,
      package: "complete_criminal",
      driver_license_number,
      driver_license_state,
      driver_license_country,
    });
    const report = reportRes.data;
    functions.logger.info("Checkr report initiated:", report.id, "Status:", report.status);

    await driverRef.update({
      "checkrCandidateId": candidate.id,
      "checkrReportId": report.id,
      "backgroundCheckStatus": report.status,
    });
    functions.logger.info("Firestore updated with Checkr details for UID:", uid);


    return res.status(200).json({
      message: "Verificación de antecedentes iniciada correctamente.",
      report_id: report.id,
      status: report.status,
    });

  } catch (error) {
    let errorMessage = "Ocurrió un error inesperado al iniciar la verificación de antecedentes.";
    let statusCode = 500;

    if (isAxiosError(error)) {
      if (error.response) {
        statusCode = error.response.status;
        functions.logger.error("Checkr API error response:", error.response.data);

        if (error.response.data && typeof error.response.data === "object" && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data && typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else {
          errorMessage = `Error de la API de Checkr: ${error.response.statusText || "Mensaje desconocido"}`;
        }
      } else if (error.request) {
        statusCode = 503;
        errorMessage = "No se recibió respuesta de la API de Checkr. Verifica tu conexión o intenta más tarde.";
        functions.logger.error("Checkr API request error:", error.message);
      } else {
        errorMessage = `Error al configurar la solicitud a Checkr: ${error.message}`;
        functions.logger.error("Axios config error:", error.message);
      }
    } else {
      functions.logger.error("Unhandled error in startBackgroundCheck:", error);
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
};