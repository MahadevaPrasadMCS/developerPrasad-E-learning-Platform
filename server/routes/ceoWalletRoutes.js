// server/routes/ceoWalletRoutes.js
import express from "express";
import {
  getAllUserWallets,
  creditUserWallet,
  debitUserWallet,
  getAllWalletTransactions,
} from "../controllers/ceoWalletController.js";
import { requireCEO } from "../middleware/authMiddleware.js";

const router = express.Router();

// CEO Wallet Management
router.get("/users", requireCEO, getAllUserWallets);
router.get("/transactions", requireCEO, getAllWalletTransactions);
router.post("/credit", requireCEO, creditUserWallet);
router.post("/debit", requireCEO, debitUserWallet);

export default router;
