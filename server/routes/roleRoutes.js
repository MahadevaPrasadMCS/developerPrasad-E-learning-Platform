import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { ceoOnly } from "../middlewares/ceoOnly.js";
import { updateRole } from "../controllers/roleController.js";

const router = express.Router();

router.patch("/:id/role", protect, ceoOnly, updateRole);

export default router;
