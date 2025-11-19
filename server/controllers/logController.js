import Log from "../models/Log.js";

export const getLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("actor", "name email role")
      .populate("target", "name email role")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
