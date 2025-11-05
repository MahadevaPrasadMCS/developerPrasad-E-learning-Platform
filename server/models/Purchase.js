import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["pdf", "video", "notes"], default: "pdf" },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  cost: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
