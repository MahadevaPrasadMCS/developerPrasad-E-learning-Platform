import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";

const router = express.Router();

/* =========================================================
💰 GET WALLET SUMMARY FOR LOGGED-IN USER
========================================================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name coins email");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure wallet exists
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) wallet = await Wallet.create({ user: user._id, transactions: [] });

    res.json({
      user,
      transactions: wallet.transactions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    res.status(500).json({ message: "Failed to load wallet" });
  }
});

/* =========================================================
🛍️ REDEEM COINS (SPEND)
========================================================= */
router.post("/redeem", authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.coins < amount)
      return res.status(400).json({ message: "Not enough coins" });

    // Deduct coins
    user.coins -= amount;
    await user.save();

    // Log to wallet
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) wallet = new Wallet({ user: user._id, transactions: [] });

    wallet.transactions.push({
      type: "spend",
      amount,
      description: description || "Store redemption",
    });
    await wallet.save();

    res.json({
      message: "Redeemed successfully",
      newBalance: user.coins,
      transactions: wallet.transactions,
    });
  } catch (error) {
    console.error("Redeem error:", error);
    res.status(500).json({ message: "Failed to redeem coins" });
  }
});

export default router;
