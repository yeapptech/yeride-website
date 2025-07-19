import express from "express";
import {onRequest} from "firebase-functions/https";
import router from "./routers";
import cors from "cors";
import { handleStripeRedirect } from "./controllers/redirect.controller.js";

const corsMiddleware = cors({origin: true});

const app = express();

app.use(corsMiddleware);

app.use("/v1", router);
app.get("/", (req, res) => {
  res.json({
    message: "Hello from Firebase Functions working with GitHub Actions!",
  });
});

export const api = onRequest({region: "us-central1"}, app);
export const stripeRedirect = onRequest({ region: "us-central1" }, handleStripeRedirect);
