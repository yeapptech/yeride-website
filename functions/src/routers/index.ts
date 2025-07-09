import express from "express";
import auth from "./auth.routes.js";

// eslint-disable-next-line new-cap
const router = express.Router();

router.use("/auth", auth );

export default router;

