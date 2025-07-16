import express from "express";
import {auth} from "../../controllers/auth/auth.controller.js";

// eslint-disable-next-line new-cap
const router = express.Router();

router.post("/register", auth);

export default router;
