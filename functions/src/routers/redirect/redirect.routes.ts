import express, { Router } from "express";
import { handleStripeRedirectLogic } from "../../controllers/redirect.controller";

const router = Router();

router.get("/:path", handleStripeRedirectLogic);

export default router;
