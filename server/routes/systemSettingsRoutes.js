// routes/systemSettingsRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getSystemSettings,
  updateBrandSettings,
  updateAvailabilitySettings,
  updateNotificationSettings,
  updateHomepageSettings,
  sendCustomEmail,
} from "../controllers/systemSettingsController.js";

const router = express.Router();

/*
 Base path: /api/system
*/

// GET settings (any authenticated user)
router.get("/settings", getSystemSettings);

// CEO-only modifications
router.patch(
  "/settings/brand",
  updateBrandSettings
);

router.patch(
  "/settings/availability",
  authMiddleware,
  updateAvailabilitySettings
);

router.patch(
  "/settings/notification",
  authMiddleware,
  updateNotificationSettings
);

router.patch(
  "/settings/homepage",
  updateHomepageSettings
);

router.post(
  "/settings/email",
  authMiddleware,
  sendCustomEmail
);

export default router;
