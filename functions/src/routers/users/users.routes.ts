import express from "express";
import { getPendingDrivers, getUsers, getUsersById } from "../../controllers/users/getUsers.controller";
import { updateDriverInsuranceStatus } from "../../controllers/users/updateDriverInsurance.controller";
import { updateDriverRegisterStatus } from "../../controllers/users/updateDriverRegister.controller";

const router = express.Router();

router.get("/", getUsers);

router.get("/pending-drivers", getPendingDrivers);

router.get("/id/:id", getUsersById);

router.put("/:id/insurance-status", updateDriverInsuranceStatus);
router.put("/:id/register-status", updateDriverRegisterStatus);


export default router;
