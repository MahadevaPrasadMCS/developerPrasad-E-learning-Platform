// server/models/RoleChangeRequest.js
import mongoose from "mongoose";
import { ROLES } from "../config/roles.js";

const DEMOTION_STATUS = [
  "PENDING_USER_REVIEW",   // Waiting user ack
  "USER_ACCEPTED",         // User agreed
  "USER_DISPUTED",         // User disputes → Final review required
  "FINALIZED",             // CEO/Admin applied the change
  "CANCELLED"              // If CEO/Admin withdraws
];

const evidenceSchema = new mongoose.Schema(
  {
    bucket: { type: String },
    path: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoleChangeRequestSchema = new mongoose.Schema(
  {
    // Who is getting demoted?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Original role at time of request
    currentRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    // Intended new role
    newRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    // Why demotion?
    reason: {
      type: String,
      required: true,
      minlength: 10,
    },

    // Uploaded proof/evidence (optional)
    evidence: evidenceSchema,

    status: {
      type: String,
      enum: DEMOTION_STATUS,
      default: "PENDING_USER_REVIEW",
    },

    // User actions
    userResponse: {
      type: String,
      enum: ["accepted", "disputed", null],
      default: null,
    },

    disputeNote: { type: String },

    // Who initiated this demotion?
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who finalized decision?
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

  },
  { timestamps: true }
);

// Ensure only 1 unfinalized demotion in progress per user
RoleChangeRequestSchema.index(
  { user: 1, status: 1 },
  {
    partialFilterExpression: {
      status: {
        $in: [
          "PENDING_USER_REVIEW",
          "USER_ACCEPTED",
          "USER_DISPUTED"
        ],
      },
    },
  }
);

export default mongoose.model(
  "RoleChangeRequest",
  RoleChangeRequestSchema
);
