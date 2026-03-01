const Payment = require("../models/payment.model");

const createPaymentForUser = async ({ userId, amount, currency, metadata }) => {
  const payment = await Payment.createPayment({
    userId,
    amount,
    currency,
    status: "pending",
    metadata,
  });
  return payment;
};

const markPaymentAsSucceeded = async (id) => {
  return Payment.updatePaymentStatus(id, "succeeded");
};

const markPaymentAsFailed = async (id) => {
  return Payment.updatePaymentStatus(id, "failed");
};

module.exports = {
  createPaymentForUser,
  markPaymentAsSucceeded,
  markPaymentAsFailed,
};

