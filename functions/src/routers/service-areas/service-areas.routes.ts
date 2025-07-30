import express from "express";
import { getServiceAreaById, getServiceAreas } from "../../controllers/service-areas/getServiceAreas.controller";

const router = express.Router();

router.get("/", getServiceAreas);

// router.get("/pending-drivers", getPendingDrivers);

router.get("/id/:id", getServiceAreaById);

// router.put("/:id/insurance-status", updateDriverInsuranceStatus);
// router.put("/:id/register-status", updateDriverRegisterStatus);


export default router;
