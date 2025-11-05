import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
const router = express.Router();

/**
 * GET Wallet Summary for Logged-in User
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name coins email");
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      user,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST Redeem Coins for a Resource
 */
router.post("/redeem", authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const user = await User.findById(req.user.id);

    if (user.coins < amount)
      return res.status(400).json({ message: "Not enough coins" });

    // Deduct coins
    user.coins -= amount;
    await user.save();

    // Record transaction
    const transaction = new Transaction({
      userId: req.user.id,
      type: "redeem",
      amount,
      description,
    });
    await transaction.save();

    res.json({
      message: "Redeemed successfully",
      newBalance: user.coins,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
