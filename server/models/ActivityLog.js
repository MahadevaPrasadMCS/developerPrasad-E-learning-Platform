import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorName: { type: String }, // snapshot for quick display
    actorRole: { type: String },

    action: { type: String, required: true }, // e.g. "CHANGE_ROLE", "UPDATE_PERMISSIONS"

    route: { type: String },     // e.g. "/api/owner/staff/123/role"
    method: { type: String },    // "GET", "POST", "PUT", etc.

    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    description: { type: String }, // human-readable summary

    meta: {                        // extra info (old/new values etc.)
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
