import express from "express";
import auth from "./auth/auth.routes.js";
import trips from "./trips/trips.routes.js"
import stripe from "./stripe/stripe.routes.js"
import checkr from "./checkr/checkr.routes.js"

const router = express.Router();

router.use("/auth", auth );
router.use("/trips", trips );
router.use("/stripe", stripe);
router.use("/checkr", checkr);

export default router;

