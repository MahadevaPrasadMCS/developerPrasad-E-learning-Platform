import Log from "../models/Log.js";

export const logAction = async ({ action, actor, target, details, ip }) => {
  try {
    await Log.create({ action, actor, target, details, ip });
  } catch (err) {
    console.error("Log create failed:", err.message);
  }
};
