import mongoose from "mongoose";

const profileChangeFieldSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      enum: ["name", "email"],
      required: true,
    },
    oldValue: { type: String, required: true },
    newValue: { type: String, required: true },
  },
  { _id: false }
);

const profileChangeRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fields: {
      type: [profileChangeFieldSchema],
      validate: v => v.length > 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: null },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // admin who processed it
    },
  },
  { timestamps: true }
);

const ProfileChangeRequest = mongoose.model(
  "ProfileChangeRequest",
  profileChangeRequestSchema
);

export default ProfileChangeRequest;
