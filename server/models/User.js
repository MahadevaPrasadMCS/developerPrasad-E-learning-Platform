import mongoose from "mongoose";
import {
  ROLES,
  DEFAULT_PERMISSIONS_BY_ROLE,
} from "../config/roles.js"; // ensure CEO role exists here

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

    /* 🔥 CEO-specific ability */
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

    /* 🔥 Wallet Balance */
    coins: { type: Number, default: 0, index: true },

    /* 🔥 Role must include CEO */
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    /* Permissions auto-managed based on role */
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

/* ⭐ Automatically set permissions from role */
userSchema.methods.applyDefaultPermissions = function () {
  const defaults = DEFAULT_PERMISSIONS_BY_ROLE[this.role] || {};
  this.permissions = {
    ...this.permissions?.toObject?.(),
    ...defaults,
  };
};

/* ⭐ On first save, assign default permissions */
userSchema.pre("save", function (next) {
  if (!this.permissions) {
    this.applyDefaultPermissions();
  }
  next();
});

/* 🔍 CEO wallet management depends on fast queries */
userSchema.index({ role: 1, coins: -1 });

/* 🔍 Text search for CEO find user by name or email */
userSchema.index({ name: "text", email: "text" });

const User = mongoose.model("User", userSchema);
export default User;
