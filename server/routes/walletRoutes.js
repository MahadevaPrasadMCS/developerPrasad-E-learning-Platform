import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";

const router = express.Router();

// GET Wallet + Paginated Transactions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    const user = await User.findById(req.user._id)
      .select("name coins email")
      .lean();

    if (!user)
      return res.status(404).json({ message: "User not found" });

    let wallet = await Wallet.findOne({ user: user._id }).lean();
    if (!wallet) {
      wallet = await Wallet.create({ user: user._id, transactions: [] });
      wallet = wallet.toObject();
    }

    const total = wallet.transactions.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const start = (page - 1) * limit;
    const paginated = wallet.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(start, start + limit);

    res.json({
      success: true,
      user,
      transactions: paginated,
      totalPages,
    });
  } catch (err) {
    console.error("Wallet fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST Spend / Redeem
router.post("/redeem", authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.coins < amount)
      return res.status(400).json({ message: "Not enough coins" });

    user.coins -= amount;
    await user.save();

    const wallet = await Wallet.findOneAndUpdate(
      { user: user._id },
      {
        $push: {
          transactions: {
            type: "spend",
            amount,
            description: description || "Store Redemption",
          },
        },
      },
      { new: true }
    );

    res.json({
      message: "Redeemed successfully",
      newBalance: user.coins,
      transactions: wallet.transactions.slice(-10),
    });
  } catch (err) {
    console.error("Redeem error:", err);
    res.status(500).json({ message: "Failed to redeem coins" });
  }
});

export default router;
