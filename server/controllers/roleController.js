// server/controllers/roleController.js
import User from "../models/User.js";
import { ROLES } from "../config/roles.js";
import { logAction } from "../utils/logAction.js";

const ROLE_ORDER = {
  [ROLES.STUDENT]: 0,
  [ROLES.MODERATOR]: 1,
  [ROLES.INSTRUCTOR]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.CEO]: 4,
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({ message: "New role is required" });
    }

    // ✅ Only known roles
    if (!Object.values(ROLES).includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // ❌ No one can be set to CEO via API
    if (newRole === ROLES.CEO) {
      return res.status(403).json({ message: "Cannot assign CEO role via system" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ❌ CEO accounts cannot be modified
    if (user.role === ROLES.CEO) {
      return res.status(403).json({ message: "Cannot modify CEO role" });
    }

    const currentRank = ROLE_ORDER[user.role];
    const requestedRank = ROLE_ORDER[newRole];

    if (
      typeof currentRank !== "number" ||
      typeof requestedRank !== "number"
    ) {
      return res.status(400).json({ message: "Role ladder misconfigured" });
    }

    // 🚦 Strict ladder (B): only one step up/down allowed
    const diff = requestedRank - currentRank;
    if (Math.abs(diff) !== 1) {
      return res.status(400).json({
        message:
          "Invalid transition. Use step-by-step promotions/demotions (e.g., Student → Moderator → Instructor → Admin).",
      });
    }

    const oldRole = user.role;
    user.role = newRole;

    // 🔄 Re-apply default permissions for new role
    if (typeof user.applyDefaultPermissions === "function") {
      user.applyDefaultPermissions();
    }

    // 🔐 Invalidate existing sessions for this user
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    user.isLoggedOut = true;

    await user.save();

    // 📝 Log audit trail
    await logAction({
      action: "ROLE_UPDATE",
      actor: req.user._id,
      target: user._id,
      details: {
        type: "DIRECT_ROLE_CHANGE",
        oldRole,
        newRole,
        via: "CEO_MANAGE_ROLES",
      },
      ip: req.ip,
    });

    return res.json({
      message: "Role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Role update error:", err);
    return res.status(500).json({ message: "Server error while updating role" });
  }
};
