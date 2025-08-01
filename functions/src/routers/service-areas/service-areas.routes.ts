import express from "express";
import { getServiceAreaById, getServiceAreas } from "../../controllers/service-areas/getServiceAreas.controller";
import { updateServiceAreas } from "../../controllers/service-areas/updateServiceAreas.controller";
import { addRideService } from "../../controllers/service-areas/addRideService.controller";
import { deleteRideService } from "../../controllers/service-areas/deleteRideService.controller";
import { deleteAppCharge } from "../../controllers/service-areas/deleteAppCharge.controller";
import { addAppCharge } from "../../controllers/service-areas/addAppCharge.controller";
import { addServiceArea } from "../../controllers/service-areas/addServiceArea.controller";
import { deleteServiceArea } from "../../controllers/service-areas/deleteServiceArea.controller";

const router = express.Router();

router.get("/", getServiceAreas);

router.get("/id/:id", getServiceAreaById);

router.post("/add-area", addServiceArea); // Añadir un serviceArea
router.put("/update-area/:id", updateServiceAreas);
router.delete("/:serviceAreaId/delete-area", deleteServiceArea); // Añadir un serviceArea

// Rutas para Ride Services (sub-colección)
router.post("/:serviceAreaId/ride-services", addRideService); // Añadir un rideService a un serviceArea
router.delete("/:serviceAreaId/ride-services/:rideServiceId", deleteRideService); // Eliminar un rideService

// Rutas para App Charges (sub-colección)
router.post("/:serviceAreaId/app-charges", addAppCharge); // Añadir un appCharge a un serviceArea
router.delete("/:serviceAreaId/app-charges/:appChargeId", deleteAppCharge); // Eliminar un appCharge

export default router;
