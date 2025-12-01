// server/models/WalletTransaction.js
import mongoose from "mongoose";

const TRANSACTION_TYPES = ["credit", "debit"]; // add more if required later
const TRANSACTION_METHODS = ["reward", "purchase", "gift", "admin_action"];

const WalletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔹 + coins OR - coins
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // 🔹 Updated coin balance after transaction — for audit
    balanceAfter: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      enum: TRANSACTION_METHODS,
      default: "purchase",
    },

    // e.g. quiz id, store item id, admin id etc.
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    relatedModel: {
      type: String,
      enum: ["Quiz", "StoreItem", "User", "Reward"],
    },

    // notes / description — for UI
    description: {
      type: String,
      default: "",
      maxlength: 200,
    },
  },
  { timestamps: true }
);

// Indexing for fast analytics filtering
WalletTransactionSchema.index({ createdAt: -1 });
WalletTransactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("WalletTransaction", WalletTransactionSchema);
