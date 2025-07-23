import express from "express";
import { getTripById, getTrips } from "../../controllers/trips/getTrips.controller";

const router = express.Router();

router.get("/", getTrips);

router.get("/:id", getTripById);


export default router;
