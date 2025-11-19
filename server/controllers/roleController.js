import User from "../models/User.js";
import { ROLES } from "../config/roles.js";
import { logAction } from "../utils/logAction.js";

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;

    const allowedRoles = [
      ROLES.ADMIN,
      ROLES.INSTRUCTOR,
      ROLES.MODERATOR,
      ROLES.STUDENT,
    ];

    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === ROLES.CEO) {
      return res.status(403).json({ message: "Cannot modify CEO role" });
    }

    user.role = newRole;
    await user.save();

    await logAction({
      action: "ROLE_UPDATE",
      actor: req.user._id,
      target: user._id,
      details: { newRole },
      ip: req.ip
    });

    res.json({ message: "Role updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
