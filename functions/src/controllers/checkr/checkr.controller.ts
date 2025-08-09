import axios from 'axios';
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { CHECKR_SECRET_KEY, CHECKR_API_URL } from "../../conf/env.js";

const db = getFirestore();

// @ts-ignore
export const startBackgroundCheck = functions.https.onRequest(async (req, res) => {
  const checkrApi = axios.create({
    baseURL: CHECKR_API_URL,
    headers: {
      Authorization: `Basic ${Buffer.from(`${CHECKR_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  let checkrCandidateId: string | null = null;

  try {
    if (!CHECKR_SECRET_KEY || !CHECKR_API_URL) {
        console.log("Missing Checkr API configuration. Please set checkr.secret_key and checkr.api_url.");
        return res.status(500).json({ error: "Configuración del servicio de verificación de antecedentes incompleta." });
    }

    if (!(req as any).user || !(req as any).user.uid) {
        return res.status(401).json({ error: "Usuario no autenticado. Requiere un token de Firebase válido." });
    }
    const uid = (req as any).user.uid;

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

    if (!first_name || !last_name || !dob || !ssn || !driver_license_number || !driver_license_state || !driver_license_country) {
      functions.logger.warn("Missing required candidate information for background check.", { uid, body: req.body });
      return res.status(400).json({ error: "Faltan datos obligatorios para la verificación de antecedentes." });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.log(`User not found for UID: ${uid}`);
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const userData = userDoc.data();
    console.log("User data retrieved:", userData);

    const candidatePayload: { [key: string]: any } = {
      first_name,
      last_name,
      dob,
      ssn,
      email: userData!.email,
      phone: userData!.phoneNumber,
      zipcode: userData!.address?.zipCode || '90210',
    };

    if (middle_name && typeof middle_name === 'string' && middle_name.trim() !== '') {
      candidatePayload.middle_name = middle_name;
      candidatePayload.no_middle_name = false;
    } else {
      candidatePayload.no_middle_name = true;
      delete candidatePayload.middle_name;
    }

    console.log("Attempting to create Checkr candidate with payload:", candidatePayload);
    const candidateRes = await checkrApi.post('/candidates', candidatePayload);
    const candidate = candidateRes.data;
    checkrCandidateId = candidate.id;
    console.log("Checkr candidate created or retrieved (deduplicated by Checkr):", candidate);

    console.log("Attempting to create Checkr report...");
    const reportRes = await checkrApi.post('/reports', {
      candidate_id: candidate.id,
      package: 'basic_plus_criminal',
      driver_license_number,
      driver_license_state,
      driver_license_country,
    });
    const report = reportRes.data;
    console.log("Checkr report initiated:", report.id, "Status:", report.status);

    const checkrDataRef = db.collection("checkrData").doc(uid);
    const checkrDataDoc = await checkrDataRef.get();

    const updateDataForCheckr: Record<string, any> = {
      checkrCandidateId: candidate.id,
      checkrReportId: report.id,
      middleName: middle_name && typeof middle_name === 'string' && middle_name.trim() !== '' ? middle_name : null,
      ssn: ssn,
      driverLicenseNumber: driver_license_number,
      driverLicenseState: driver_license_state,
      driverLicenseCountry: driver_license_country,
      status: report.status,
      result: null,
      passed: null,
      updatedAt: new Date(),
    };

    if (checkrDataDoc.exists) {
        await checkrDataRef.set(updateDataForCheckr, { merge: true });
        console.log("CheckrData document updated for UID:", uid);
    } else {
        await checkrDataRef.set({
            userId: uid,
            ...updateDataForCheckr,
            createdDateTime: new Date(),
            timestamp: new Date(),
        });
        console.log("CheckrData document created for UID:", uid);
    }

    await userRef.update({
      dateOfBirth: dob,
      middleName: middle_name && typeof middle_name === 'string' && middle_name.trim() !== '' ? middle_name : null,
    });
    console.log("User document updated (non-Checkr fields) for UID:", uid);

    return res.status(200).json({
      message: "Verificación de antecedentes iniciada correctamente.",
      report_id: report.id,
      status: report.status,
    });

  } catch (error) {
    let errorMessage = "Ocurrió un error inesperado al iniciar la verificación de antecedentes.";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        statusCode = error.response.status;
        console.log("Checkr API error response:", error.response.data);

        if (error.response.data && typeof error.response.data === 'object') {
            if (error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.response.data.details && Array.isArray(error.response.data.details) && error.response.data.details.length > 0) {
                errorMessage = `Errores de validación de Checkr: ${error.response.data.details.map(d => `${d.field}: ${d.message}`).join('; ')}`;
            } else {
                errorMessage = `Error de la API de Checkr: ${JSON.stringify(error.response.data)}`;
            }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else {
          errorMessage = `Error de la API de Checkr: ${error.response.statusText || 'Mensaje desconocido'}`;
        }
      } else if (error.request) {
        statusCode = 503;
        errorMessage = "No se recibió respuesta de la API de Checkr. Verifica tu conexión o intenta más tarde.";
        console.log("Checkr API request error:", error.message);
      } else {
        errorMessage = `Error al configurar la solicitud a Checkr: ${error.message}`;
        console.log("Axios config error:", error.message);
      }
    } else {
      console.log("Unhandled error in startBackgroundCheck:", error);
    }

    if (checkrCandidateId) {
        try {
            console.log(`Attempting to delete Checkr candidate ${checkrCandidateId} due to error.`);
            await checkrApi.delete(`/candidates/${checkrCandidateId}`);
            console.log(`Checkr candidate ${checkrCandidateId} successfully deleted.`);
        } catch (deleteError) {
            if (axios.isAxiosError(deleteError) && deleteError.response?.status === 404) {
                 console.log(`Checkr candidate ${checkrCandidateId} was likely already deleted by Checkr or not found.`);
            } else {
                console.error(`Failed to delete Checkr candidate ${checkrCandidateId}:`, deleteError);
                errorMessage += " No se pudo eliminar el candidato de Checkr asociado (inténtelo de nuevo o contacte soporte).";
            }
        }
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
});