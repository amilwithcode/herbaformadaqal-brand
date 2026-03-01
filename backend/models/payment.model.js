const { query } = require("../config/db.config");

const createPayment = async ({ userId, amount, currency, status, metadata }) => {
  const res = await query(
    `INSERT INTO payments (user_id, amount, currency, status, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, amount, currency, status, metadata, created_at`,
    [userId, amount, currency, status, metadata ? JSON.stringify(metadata) : null]
  );
  return res.rows[0];
};

const listUserPayments = async (userId) => {
  const res = await query(
    `SELECT id, user_id, amount, currency, status, metadata, created_at
     FROM payments
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

const updatePaymentStatus = async (id, status) => {
  const res = await query(
    `UPDATE payments
     SET status = $2
     WHERE id = $1
     RETURNING id, user_id, amount, currency, status, metadata, created_at`,
    [id, status]
  );
  return res.rows[0] || null;
};

module.exports = {
  createPayment,
  listUserPayments,
  updatePaymentStatus,
};

