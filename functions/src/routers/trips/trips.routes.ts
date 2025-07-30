import express from "express";
import {
  getTripById,
  getTrips,
  updateTripStatus,
} from "../../controllers/trips/getTrips.controller";

const router = express.Router();

router.get("/", getTrips);
router.get("/:id", getTripById);
router.patch("/:tripId/status", updateTripStatus);

export default router;
