import express from "express";
import protect from "../middleware/authMiddleware.js";
import { ceoOnly } from "../middleware/ceoOnly.js";
import { updateRole } from "../controllers/roleController.js";

const router = express.Router();

router.patch("/:id/role", protect, ceoOnly, updateRole);

export default router;
