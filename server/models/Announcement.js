const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  weekNumber: { type: Number, required: true },
  winners: [{ name: String, coins: Number }], // top 3 users
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Announcement", announcementSchema);
