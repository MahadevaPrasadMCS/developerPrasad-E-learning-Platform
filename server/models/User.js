//models/User.js
import mongoose from "mongoose";
import {
  ROLES,
  DEFAULT_PERMISSIONS_BY_ROLE,
} from "../config/roles.js";

const permissionsSchema = new mongoose.Schema(
  {
    manageUsers: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false },
    manageRoles: { type: Boolean, default: false },
    manageQuizzes: { type: Boolean, default: false },
    manageResources: { type: Boolean, default: false },
    manageAnnouncements: { type: Boolean, default: false },
    manageRewards: { type: Boolean, default: false },
    manageCommunity: { type: Boolean, default: false },
    manageWalletSystem: { type: Boolean, default: false },
    viewAnalytics: { type: Boolean, default: false },
    viewAdminLogs: { type: Boolean, default: false },
    manageProfileRequests: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 0, index: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },

    avatarUrl: { type: String, default: null },

    bio: {
      type: String,
      trim: true,
      default: "",
    },

    permissions: {
      type: permissionsSchema,
      default: undefined,
    },

    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: null },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    blockTimestamp: { type: Date, default: null },
    isLoggedOut: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.methods.applyDefaultPermissions = function () {
  const defaults = DEFAULT_PERMISSIONS_BY_ROLE[this.role] || {};
  this.permissions = { ...this.permissions?.toObject?.(), ...defaults };
};

userSchema.pre("save", function (next) {
  if (!this.permissions) this.applyDefaultPermissions();
  next();
});

userSchema.index({ role: 1, coins: -1 });
userSchema.index({ name: "text", email: "text" });

export default mongoose.model("User", userSchema);
