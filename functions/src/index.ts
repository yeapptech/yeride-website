import express from "express";
import { onRequest } from "firebase-functions/https";
import router from "./routers";
const cors = require("cors")({ origin: true });

const app = express();

app.use(cors);

app.use("/v1", router);
app.get("/", (req, res) => {
  res.json({
    message: "Hello from Firebase Functions!",
  });
});

export const api = onRequest({ region: "us-central1" }, app);
