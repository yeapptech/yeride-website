import express from "express";
import { getPendingDrivers, getUsers, getUsersById } from "../../controllers/users/getUsers.controller";
import { updateDriverInsuranceStatus } from "../../controllers/users/updateDriverInsurance.controller";
import { updateDriverRegisterStatus } from "../../controllers/users/updateDriverRegister.controller";
import { updatePersonalInfo } from "../../controllers/users/updatePersonalInfo.controller";

const router = express.Router();

router.get("/", getUsers);

router.get("/pending-drivers", getPendingDrivers);

router.get("/id/:id", getUsersById);

router.put("/:id/insurance-status", updateDriverInsuranceStatus);
router.put("/:id/register-status", updateDriverRegisterStatus);

router.put("/:id/personal-info", updatePersonalInfo);


export default router;
