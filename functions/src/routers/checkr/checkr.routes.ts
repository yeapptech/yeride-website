import bodyParser from "body-parser";
import { Router } from "express";
import { startBackgroundCheck } from "../../controllers/checkr/checkr.controller.js";
import { checkrWebhook } from "../../controllers/checkr/checkrWebhook.controller.js";
import authenticateFirebaseToken from "../../middleware/authenticateFirebaseToken.js";

const router = Router();

router.post("/start-background-check", authenticateFirebaseToken, startBackgroundCheck);
router.post("/webhook", bodyParser.raw({type: "application/json"}), checkrWebhook);

export default router;