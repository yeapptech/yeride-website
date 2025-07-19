import express from "express";
import {auth} from "../../controllers/auth/auth.controller.js";

const router = express.Router();

router.post("/register", auth);

export default router;
