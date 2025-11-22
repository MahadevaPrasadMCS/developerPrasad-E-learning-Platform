// models/SystemSettings.js
import mongoose from "mongoose";

const GlobalNotificationSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: "" },
  },
  { _id: false }
);

const HomepageBannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const SystemSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "YouLearnHub",
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default:
        "We are under scheduled maintenance. Please try again later.",
    },
    allowRegistrations: {
      type: Boolean,
      default: true,
    },

    globalNotification: {
      type: GlobalNotificationSchema,
      default: () => ({}),
    },

    homepageBanner: {
      type: HomepageBannerSchema,
      default: () => ({}),
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Helper to always work with a single document
SystemSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const SystemSettings = mongoose.model("SystemSettings", SystemSettingsSchema);
export default SystemSettings;
