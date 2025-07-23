import express from "express";
import { getUsers, getUsersById, getUsersByRole } from "../../controllers/users/getUsers.controller";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUsersByRole);

router.get("/id/:id", getUsersById);

export default router;
