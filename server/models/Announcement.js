import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  weekNumber: { type: Number, required: true },
  winners: [{ name: String, coins: Number }], // top 3 users
  createdAt: { type: Date, default: Date.now },
});

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;