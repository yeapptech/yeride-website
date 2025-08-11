import express from "express";
import auth from "./auth/auth.routes.js";
import trips from "./trips/trips.routes.js"
import stripe from "./stripe/stripe.routes.js"
import checkr from "./checkr/checkr.routes.js"
import users from "./users/users.routes.js";
import serviceAreas from "./service-areas/service-areas.routes.js";
import redirect from "./redirect/redirect.routes.js";
import apiCosts from "./api-cost/apiCost.routes.js";

const router = express.Router();

router.use("/auth", auth );
router.use("/trips", trips );
router.use("/stripe", stripe);
router.use("/checkr", checkr);
router.use("/users", users);
router.use("/service-areas", serviceAreas);
router.use("/stripeRedirect", redirect);
router.use("/api-costs", apiCosts);

export default router;
