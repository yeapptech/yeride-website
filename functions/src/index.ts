import express from "express";
import { onRequest } from "firebase-functions/v2/https"; 
import router from "./routers";
import cors from "cors";
import { handleStripeRedirect } from "./controllers/redirect.controller.js";

const app = express();

app.use("/v1", router);

app.get('/', (req, res) => {
  res.json({ status: 'YeDrive root online' });
});

export const api = onRequest({ region: 'us-central1' }, app);
export const stripeRedirect = onRequest({ region: 'us-central1' }, handleStripeRedirect);