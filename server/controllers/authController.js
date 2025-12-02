// server/controllers/authController.js
import User from "../models/User.js";

/* ==============================
   GET AUTHENTICATED USER PROFILE
   GET /api/auth/me
=================================*/
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      coins: user.coins,
      role: user.role,
      permissions: user.permissions || [],
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || "",
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });

  } catch (err) {
    console.error("GetMe Error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/* ==============================
   UPDATE PROFILE (name + bio)
   PATCH /api/auth/update
=================================*/
export const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        bio: bio?.trim() || "",
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

/* ==============================
   UPDATE AVATAR ONLY
   PATCH /api/auth/update-avatar
=================================*/
export const updateAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: "Avatar URL required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Avatar updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("Avatar update error:", err);
    res.status(500).json({ message: "Failed to update avatar" });
  }
};
