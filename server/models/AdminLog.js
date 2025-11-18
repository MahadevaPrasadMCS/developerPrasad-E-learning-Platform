import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    action: {
      type: String,
      enum: [
        "block_user",
        "unblock_user",
        "add_coins",
        "deduct_coins",
        "update_role",
      ],
      required: true,
    },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("AdminLog", adminLogSchema);
