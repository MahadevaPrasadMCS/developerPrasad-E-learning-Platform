// server/routes/roleRoutes.js
import express from "express";
import { ceoOnly } from "../middleware/ceoOnly.js";
import { updateRole } from "../controllers/roleController.js";

const router = express.Router();

// PATCH /api/ceo/roles/:id/role
router.patch("/:id/role", ceoOnly, updateRole);

export default router;
