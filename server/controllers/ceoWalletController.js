// server/controllers/ceoWalletController.js
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

/**
 * GET /api/ceo/wallet/users
 * List all users with wallet balance (for CEO dashboard)
 */
export const getAllUserWallets = async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email coins role")
      .sort({ coins: -1 });

    res.json(users);
  } catch (err) {
    console.error("getAllUserWallets error:", err);
    res.status(500).json({ message: "Failed to load user wallets" });
  }
};

/**
 * POST /api/ceo/wallet/credit
 */
export const creditUserWallet = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount || amount <= 0)
      return res.status(400).json({ message: "Invalid request" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.coins += Number(amount);
    await user.save();

    await WalletTransaction.create({
      user: user._id,
      type: "credit",
      amount,
      balanceAfter: user.coins,
      method: "admin_action",
      description,
      performedBy: req.user._id, // CEO
      relatedModel: "User",
      relatedTo: req.user._id,
    });

    res.json({ message: "Coins added successfully", newBalance: user.coins });
  } catch (err) {
    console.error("creditUserWallet error:", err);
    res.status(500).json({ message: "Failed to credit wallet" });
  }
};

/**
 * POST /api/ceo/wallet/debit
 */
export const debitUserWallet = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount || amount <= 0)
      return res.status(400).json({ message: "Invalid request" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.coins < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    user.coins -= Number(amount);
    await user.save();

    await WalletTransaction.create({
      user: user._id,
      type: "debit",
      amount,
      balanceAfter: user.coins,
      method: "admin_action",
      description,
      performedBy: req.user._id,
      relatedModel: "User",
      relatedTo: req.user._id,
    });

    res.json({ message: "Coins deducted successfully", newBalance: user.coins });
  } catch (err) {
    console.error("debitUserWallet error:", err);
    res.status(500).json({ message: "Failed to debit wallet" });
  }
};

/**
 * GET /api/ceo/wallet/transactions
 * Full system audit of all coin transactions
 */
export const getAllWalletTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({})
      .populate("user", "name email")
      .populate("performedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error("getAllWalletTransactions error:", err);
    res.status(500).json({ message: "Failed to load transactions" });
  }
};
