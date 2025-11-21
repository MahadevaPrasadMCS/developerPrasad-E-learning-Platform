import mongoose from "mongoose";

// Action Categories — can be extended later
const LOG_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "ROLE_UPDATE",
  "PROMOTION_REQUEST",
  "PROMOTION_APPROVED",
  "PROMOTION_REJECTED",
  "PROFILE_UPDATE",
  "QUIZ_ACTION",
  "WALLET_ACTION",
  "RESOURCE_UPLOAD",
  "SECURITY_ALERT",
];

const ACTOR_TYPES = ["user", "admin", "ceo", "system"];

const SystemLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // System actions don't have actor
    },

    actorRole: {
      type: String,
      enum: [...ACTOR_TYPES, "moderator", "instructor", "student"],
      default: "system",
    },

    // Describes what action occurred
    action: {
      type: String,
      enum: LOG_ACTIONS,
      required: true,
    },

    // Optional: which user this action affected
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ip: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = log time
  }
);

// Indexes for fast CEO/Admin filtering
SystemLogSchema.index({ createdAt: -1 });
SystemLogSchema.index({ actorRole: 1 });
SystemLogSchema.index({ action: 1 });
SystemLogSchema.index({ target: 1 });

export default mongoose.model("SystemLog", SystemLogSchema);
