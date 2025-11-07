import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    links: [
      {
        type: String,
        trim: true,
        validate: {
          validator: (v) => !v || /^https?:\/\/.+/.test(v),
          message: "Invalid URL format",
        },
      },
    ],
    specialThings: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
