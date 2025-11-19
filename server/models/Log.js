import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "ROLE_UPDATE",
        "CONTENT_APPROVAL",
        "PROFILE_UPDATE_REQUEST",
        "USER_MANAGEMENT",
        "COMMUNITY_ACTION",
        "WALLET_ACTION",
        "REWARD_ACTION",
      ],
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    details: { type: Object },
    ip: String,
  },
  { timestamps: true }
);

export default mongoose.model("Log", logSchema);
