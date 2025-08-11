import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import router from "./routers";
import cors from "cors";

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-custom-header'],
  credentials: true,
}));

app.use(express.json());

app.use("/v1", router);

app.get('/', (req, res) => {
  res.json({ status: 'YeDrive root online!!!!!' });
});

export const api = onRequest({ region: 'us-central1' }, app);