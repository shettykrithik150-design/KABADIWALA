const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const {
    createTransactionValidation,
    transactionIdParamValidation,
    updateTransactionStatusValidation
} = require("../validators");

const {
    createTransaction,
    getMyTransactions,
    getTransactionById,
    updateTransactionStatus
} = require("../controllers/transactionController");

const router = express.Router();

// 1. Create transaction (Recycler or Collector)
router.post("/", authenticateToken, createTransactionValidation, createTransaction);

// 2. View my transactions (Collector or Recycler)
router.get("/my", authenticateToken, getMyTransactions);
router.get("/", authenticateToken, getMyTransactions);

// 3. View transaction by ID
router.get("/:id", authenticateToken, transactionIdParamValidation, getTransactionById);

// 4. Update transaction status (PUT and PATCH)
router.put("/:id/status", authenticateToken, updateTransactionStatusValidation, updateTransactionStatus);
router.patch("/:id/status", authenticateToken, updateTransactionStatusValidation, updateTransactionStatus);

module.exports = router;
