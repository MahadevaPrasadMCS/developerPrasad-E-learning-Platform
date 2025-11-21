// server/routes/promotionRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";

import {
  requestPromotion,
  ceoInitiatePromotion,
  getAllPromotionRequests,
  scheduleInterview,
  completeInterview,
  confirmInterviewStatus,
  approvePromotion,
  rejectPromotion,
} from "../controllers/promotionController.js";

const router = express.Router();

/**
 * Public: None
 * All require authentication below
 */
router.use(authMiddleware);

/**
 * User → Request Promotion
 */
router.post("/", requestPromotion);

/**
 * CEO → Manually initiate promotion
 */
router.post("/ceo-initiate", requireRoles(ROLES.CEO), ceoInitiatePromotion);

/**
 * CEO/Admin → View promotion queue
 */
router.get("/", requireRoles(ROLES.CEO, ROLES.ADMIN), getAllPromotionRequests);

/**
 * CEO/Admin → Schedule interview
 */
router.patch(
  "/:id/interview",
  requireRoles(ROLES.CEO, ROLES.ADMIN),
  scheduleInterview
);

/**
 * CEO/Admin → Mark interview completed + upload proof
 */
router.patch(
  "/:id/interview-complete",
  requireRoles(ROLES.CEO, ROLES.ADMIN),
  completeInterview
);

/**
 * User → Confirm interview happened
 */
router.patch("/:id/confirm", confirmInterviewStatus);

/**
 * CEO → Final approval → update role
 */
router.patch(
  "/:id/approve",
  requireRoles(ROLES.CEO),
  approvePromotion
);

/**
 * CEO → Reject promotion → apply cooldown
 */
router.patch(
  "/:id/reject",
  requireRoles(ROLES.CEO),
  rejectPromotion
);

export default router;
