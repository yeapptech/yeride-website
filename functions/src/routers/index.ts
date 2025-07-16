import express from "express";
import auth from "./auth/auth.routes.js";
import trips from "./trips/trips.routes.js"

const router = express.Router();

router.use("/auth", auth );
router.use("/trips", trips );

export default router;

