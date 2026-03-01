const { query } = require("../config/db.config");

const listBookings = async () => {
  const res = await query(
    "SELECT id, user_id, program_id, status, scheduled_at, created_at FROM bookings ORDER BY created_at DESC"
  );
  return res.rows;
};

const createBooking = async ({ userId, programId, scheduledAt }) => {
  const res = await query(
    `INSERT INTO bookings (user_id, program_id, status, scheduled_at)
     VALUES ($1, $2, 'pending', $3)
     RETURNING id, user_id, program_id, status, scheduled_at, created_at`,
    [userId, programId, scheduledAt]
  );
  return res.rows[0];
};

const updateBookingStatus = async (id, status) => {
  const res = await query(
    `UPDATE bookings
     SET status = $2
     WHERE id = $1
     RETURNING id, user_id, program_id, status, scheduled_at, created_at`,
    [id, status]
  );
  return res.rows[0] || null;
};

module.exports = {
  listBookings,
  createBooking,
  updateBookingStatus,
};

