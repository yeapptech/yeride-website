import express from "express";
import { getApiCost } from "../../controllers/apiCost/getApiCost.controller";
import { updateApiCost } from "../../controllers/apiCost/updateApiCost.controller";
import { addApiCost } from "../../controllers/apiCost/addApiCost.controller";
import { deleteApiCost } from "../../controllers/apiCost/deleteApiCost.controller";

const router = express.Router();

router.get("/", getApiCost);

router.put("/:costName", updateApiCost);

router.put("/add/:costName", addApiCost);

router.delete("/:costName", deleteApiCost);

export default router;
