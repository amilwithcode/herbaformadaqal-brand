const express = require("express");
const PaymentService = require("../services/payment.service");
const authMiddleware = require("../middleware/auth.middleware");
const Payment = require("../models/payment.model");

const router = express.Router();

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { amount, currency, metadata } = req.body;
    if (!amount || !currency) {
      return res
        .status(400)
        .json({ message: "Məbləğ və valyuta tələb olunur" });
    }
    const payment = await PaymentService.createPaymentForUser({
      userId,
      amount,
      currency,
      metadata,
    });
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    const payments = await Payment.listUserPayments(userId);
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

