// server/routes/roleChangeRoutes.js
import express from "express";
import {
  initiateDemotion,
  userRespondDemotion,
  finalizeDemotion,
  cancelDemotion,
  listDemotionRequests,
  myDemotionRequest,
} from "../controllers/roleChangeController.js";

import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

// CEO/Admin create request
router.post("/", requireRoles(ROLES.CEO, ROLES.ADMIN), initiateDemotion);

// CEO/Admin - list all requests
router.get("/", requireRoles(ROLES.CEO, ROLES.ADMIN), listDemotionRequests);

// CEO/Admin cancel
router.patch("/:id/cancel", requireRoles(ROLES.CEO, ROLES.ADMIN), cancelDemotion);

// CEO/Admin finalize demotion
router.patch("/:id/finalize", requireRoles(ROLES.CEO, ROLES.ADMIN), finalizeDemotion);

// USER - view own
router.get("/mine", myDemotionRequest);

// USER - respond (accept / dispute)
router.patch("/:id/respond", userRespondDemotion);

export default router;
