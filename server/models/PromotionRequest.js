// server/models/PromotionRequest.js
import mongoose from "mongoose";
import { ROLES } from "../config/roles.js";

const PROMOTION_STATUS = [
  "PENDING_REVIEW",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_CONFIRMED",
  "APPROVED",
  "REJECTED",
];

const interviewSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date },
    mode: {
      type: String,
      enum: ["online", "offline", null],
      default: null,
    },
    meetingLink: { type: String },
    location: { type: String },
    notes: { type: String },

    // User confirms they will attend
    confirmedByUser: {
      type: Boolean,
      default: false,
    },

    // 🆕 Proof attachment (via Supabase)
    proof: {
      bucket: { type: String },
      path: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      uploadedAt: { type: Date },
    },

    result: {
      type: String,
      enum: ["pass", "fail", null],
      default: null,
    },
  },
  { _id: false }
);

const PromotionRequestSchema = new mongoose.Schema(
  {
    // Who is being promoted?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who initiated the flow? ("user" or "ceo")
    initiatedBy: {
      type: String,
      enum: ["user", "ceo"],
      required: true,
    },

    currentRoleAtRequest: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    requestedRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    status: {
      type: String,
      enum: PROMOTION_STATUS,
      default: "PENDING_REVIEW",
    },

    interview: {
      type: interviewSchema,
      default: () => ({}),
    },

    ceoNotes: { type: String },

    // To track modification source
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ⏳ Cooldown after rejection
    cooldownEndsAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Active request index – ensure only one active workflow
PromotionRequestSchema.index(
  { user: 1, status: 1 },
  {
    partialFilterExpression: {
      status: { $in: ["PENDING_REVIEW", "INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED"] },
    },
  }
);

// Helper method
PromotionRequestSchema.methods.isActive = function () {
  return ["PENDING_REVIEW", "INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED"].includes(this.status);
};

export default mongoose.model("PromotionRequest", PromotionRequestSchema);
