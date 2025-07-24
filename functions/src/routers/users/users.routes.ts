import express from "express";
import { getUsers, getUsersById, getUsersByRole } from "../../controllers/users/getUsers.controller";
import { updateDriverInsuranceStatus } from "../../controllers/users/updateUser.controller";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUsersByRole);

router.get("/id/:id", getUsersById);

router.patch("/:id/insurance-status", updateDriverInsuranceStatus);


export default router;
