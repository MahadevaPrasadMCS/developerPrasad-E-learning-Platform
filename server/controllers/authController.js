// server/controllers/authController.js
import User from "../models/User.js";

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const updateData = {
      name: name.trim(),
      bio: bio?.trim() || "",
      avatarUrl: avatarUrl?.trim() || null
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, // 👈 Correct field
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};
