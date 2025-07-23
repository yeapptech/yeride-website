import express from "express";
import {auth, login} from "../../controllers/auth/auth.controller.js";

const router = express.Router();

router.post("/register", auth);
router.post("/login", login);

export default router;
