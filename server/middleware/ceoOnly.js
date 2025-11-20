import { ROLES } from "../config/roles.js";

export const ceoOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.CEO) {
    return res.status(403).json({ message: "CEO access only" });
  }
  next();
};
