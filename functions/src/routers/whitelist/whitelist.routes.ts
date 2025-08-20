import express from "express";
import { getWhitelist } from "../../controllers/whitelist/getWhitelist.controller";

const router = express.Router();

router.get("/", getWhitelist);


export default router;
