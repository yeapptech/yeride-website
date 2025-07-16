import express from "express";
import { getTrips } from "../../controllers/trips/getTrips.controller";

const router = express.Router();

router.get("/", getTrips);

export default router;
