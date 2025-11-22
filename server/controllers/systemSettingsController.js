// controllers/systemSettingsController.js
import SystemSettings from "../models/SystemSettings.js";
import SystemLog from "../models/SystemLog.js";
// If you don't want logs, you can remove SystemLog usage.

const ensureCeo = (req, res) => {
  if (!req.user || req.user.role !== "ceo") {
    res.status(403).json({ message: "Only CEO can modify system settings" });
    return false;
  }
  return true;
};

/* =======================
   GET /api/system/settings
   Any authenticated user can read settings
======================= */
export const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSingleton();
    return res.json(settings);
  } catch (err) {
    console.error("getSystemSettings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load system settings" });
  }
};

/* =======================
   PATCH /api/system/settings/brand
   CEO only
======================= */
export const updateBrandSettings = async (req, res) => {
  if (!ensureCeo(req, res)) return;

  try {
    const { platformName, logoUrl } = req.body;

    if (!platformName || !platformName.trim()) {
      return res
        .status(400)
        .json({ message: "Platform name cannot be empty" });
    }

    const settings = await SystemSettings.getSingleton();

    settings.platformName = platformName.trim();
    settings.logoUrl = logoUrl?.trim() || "";
    settings.updatedBy = req.user._id;
    settings.updatedAt = new Date();

    await settings.save();

    // Log
    try {
      await SystemLog.create({
        actor: req.user._id,
        action: "SYSTEM_SETTINGS_BRAND_UPDATE",
        details: {
          platformName: settings.platformName,
          hasLogo: !!settings.logoUrl,
        },
      });
    } catch (logErr) {
      console.error("SystemLog brand update error:", logErr);
    }

    return res.json({
      success: true,
      message: "Branding settings updated",
      settings,
    });
  } catch (err) {
    console.error("updateBrandSettings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update branding settings" });
  }
};

/* =======================
   PATCH /api/system/settings/availability
   CEO only
======================= */
export const updateAvailabilitySettings = async (req, res) => {
  if (!ensureCeo(req, res)) return;

  try {
    const { maintenanceMode, maintenanceMessage, allowRegistrations } =
      req.body;

    const settings = await SystemSettings.getSingleton();

    if (typeof maintenanceMode === "boolean") {
      settings.maintenanceMode = maintenanceMode;
    }
    if (typeof maintenanceMessage === "string") {
      settings.maintenanceMessage =
        maintenanceMessage.trim() ||
        "We are under scheduled maintenance. Please try again later.";
    }
    if (typeof allowRegistrations === "boolean") {
      settings.allowRegistrations = allowRegistrations;
    }

    settings.updatedBy = req.user._id;
    settings.updatedAt = new Date();

    await settings.save();

    try {
      await SystemLog.create({
        actor: req.user._id,
        action: "SYSTEM_SETTINGS_AVAILABILITY_UPDATE",
        details: {
          maintenanceMode: settings.maintenanceMode,
          allowRegistrations: settings.allowRegistrations,
        },
      });
    } catch (logErr) {
      console.error("SystemLog availability update error:", logErr);
    }

    return res.json({
      success: true,
      message: "Availability settings updated",
      settings,
    });
  } catch (err) {
    console.error("updateAvailabilitySettings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update availability settings" });
  }
};

/* =======================
   PATCH /api/system/settings/notification
   CEO only
======================= */
export const updateNotificationSettings = async (req, res) => {
  if (!ensureCeo(req, res)) return;

  try {
    const { enabled, message } = req.body;
    const settings = await SystemSettings.getSingleton();

    if (typeof enabled === "boolean") {
      settings.globalNotification.enabled = enabled;
    }
    if (typeof message === "string") {
      settings.globalNotification.message = message.trim();
    }

    settings.updatedBy = req.user._id;
    settings.updatedAt = new Date();

    await settings.save();

    try {
      await SystemLog.create({
        actor: req.user._id,
        action: "SYSTEM_SETTINGS_NOTIFICATION_UPDATE",
        details: {
          enabled: settings.globalNotification.enabled,
        },
      });
    } catch (logErr) {
      console.error("SystemLog notification update error:", logErr);
    }

    return res.json({
      success: true,
      message: "Notification settings updated",
      settings,
    });
  } catch (err) {
    console.error("updateNotificationSettings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update notification settings" });
  }
};

/* =======================
   PATCH /api/system/settings/homepage
   CEO only
======================= */
export const updateHomepageSettings = async (req, res) => {
  if (!ensureCeo(req, res)) return;

  try {
    const { title, subtitle, imageUrl } = req.body;
    const settings = await SystemSettings.getSingleton();

    if (typeof title === "string") {
      settings.homepageBanner.title = title.trim();
    }
    if (typeof subtitle === "string") {
      settings.homepageBanner.subtitle = subtitle.trim();
    }
    if (typeof imageUrl === "string") {
      settings.homepageBanner.imageUrl = imageUrl.trim();
    }

    settings.updatedBy = req.user._id;
    settings.updatedAt = new Date();

    await settings.save();

    try {
      await SystemLog.create({
        actor: req.user._id,
        action: "SYSTEM_SETTINGS_HOMEPAGE_UPDATE",
        details: {
          hasImage: !!settings.homepageBanner.imageUrl,
        },
      });
    } catch (logErr) {
      console.error("SystemLog homepage update error:", logErr);
    }

    return res.json({
      success: true,
      message: "Homepage settings updated",
      settings,
    });
  } catch (err) {
    console.error("updateHomepageSettings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update homepage settings" });
  }
};

/* =======================
   POST /api/system/settings/email
   CEO only
   (Integrate with email provider here)
======================= */
export const sendCustomEmail = async (req, res) => {
  if (!ensureCeo(req, res)) return;

  try {
    const { target, subject, body } = req.body;

    if (!subject || !subject.trim() || !body || !body.trim()) {
      return res
        .status(400)
        .json({ message: "Subject and body are required" });
    }

    // TODO: implement logic to fetch recipients based on `target`
    // target might be: "ADMINS_TEACHERS", "ADMINS_ONLY", "TEACHERS_ONLY", "ALL_NON_STUDENTS"
    // Example (pseudo):
    // const recipients = await User.find({ role: { $in: [...] } });

    // TODO: integrate with your email service (nodemailer / Resend / SES etc.)
    // For now just log:
    console.log("Custom email dispatch:", {
      from: req.user.email,
      target,
      subject,
    });

    try {
      await SystemLog.create({
        actor: req.user._id,
        action: "SYSTEM_SETTINGS_SEND_EMAIL",
        details: {
          target,
          subject,
        },
      });
    } catch (logErr) {
      console.error("SystemLog email send error:", logErr);
    }

    return res.json({
      success: true,
      message: "Email send queued / simulated (implement real sending)",
    });
  } catch (err) {
    console.error("sendCustomEmail error:", err);
    return res.status(500).json({ message: "Failed to send email" });
  }
};
