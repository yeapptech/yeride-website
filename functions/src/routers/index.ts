import express from "express";
import auth from "./auth/auth.routes.js";
import trips from "./trips/trips.routes.js"
import stripe from "./stripe/stripe.routes.js"
import checkr from "./checkr/checkr.routes.js"
import users from "./users/users.routes.js";

const router = express.Router();

router.use("/auth", auth );
router.use("/trips", trips );
router.use("/stripe", stripe);
router.use("/checkr", checkr);
router.use("/users", users);

export default router;

