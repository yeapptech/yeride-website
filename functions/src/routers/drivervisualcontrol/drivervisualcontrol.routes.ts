import express from "express";
import { getDriverVisualControl } from "../../controllers/drivervisualcontrol/getDriverControl.controller";
import { updateDriverVisualControl } from "../../controllers/drivervisualcontrol/updateDriverControl.controller";

const router = express.Router();

router.get("/", getDriverVisualControl);
router.put("/update", updateDriverVisualControl);

export default router;
