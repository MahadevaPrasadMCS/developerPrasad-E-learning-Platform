// server/models/Log.js
import mongoose from "mongoose";

const LOG_ACTIONS = [
  "ROLE_UPDATE",
  "PROMOTION_REQUEST",
  "PROMOTION_INTERVIEW",
  "PROMOTION_DECISION",
  "CONTENT_APPROVAL",
  "PROFILE_UPDATE_REQUEST",
  "USER_MANAGEMENT",
  "COMMUNITY_ACTION",
  "WALLET_ACTION",
  "REWARD_ACTION",
  "SECURITY_EVENT", // login failures, blocked access, etc.
];

const LOG_CATEGORIES = [
  "ROLE",
  "PROMOTION",
  "CONTENT",
  "PROFILE",
  "USER",
  "COMMUNITY",
  "WALLET",
  "REWARD",
  "SECURITY",
  "SYSTEM",
];

const logSchema = new mongoose.Schema(
  {
    // high-level type of action
    action: {
      type: String,
      required: true,
      enum: LOG_ACTIONS,
    },

    // optional broader grouping for filters
    category: {
      type: String,
      enum: LOG_CATEGORIES,
      default: "SYSTEM",
    },

    // short human-readable summary for UI + search
    description: {
      type: String,
      trim: true,
    },

    // who performed the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // who/what was affected (optional)
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // any structured data
    details: {
      type: Object,
    },

    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

// helpful indexes
logSchema.index({ createdAt: -1 });
logSchema.index({ action: 1, category: 1 });
logSchema.index({ actor: 1, target: 1 });

// text search on description
logSchema.index({ description: "text" });

export default mongoose.model("Log", logSchema);
