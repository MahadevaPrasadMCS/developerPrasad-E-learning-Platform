import express from "express";
import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";
import { updateRole } from "../controllers/roleController.js";

const router = express.Router();

// CEO-only can change roles
router.patch(
  "/:id/role",
  requireRoles(ROLES.CEO),
  updateRole
);

export default router;
