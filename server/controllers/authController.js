// server/controllers/authController.js
 const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, avatarUrl: avatarUrl || null },
      { new: true }
    ).select("-password");

    return res.json({
      message: "Profile updated successfully",
      user: updated
    });

  } catch (err) {
    res.status(500).json({ message: "Profile update failed" });
  }
};

export default {
  updateProfile
};