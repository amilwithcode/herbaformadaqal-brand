const { query } = require("../config/db.config");

const findByEmail = async (email) => {
  const res = await query("SELECT * FROM users WHERE email = $1 LIMIT 1", [
    email,
  ]);
  return res.rows[0] || null;
};

const findById = async (id) => {
  const res = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  return res.rows[0] || null;
};

const createUser = async ({ fullName, email, passwordHash }) => {
  const res = await query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, full_name, email, created_at`,
    [fullName, email, passwordHash]
  );
  return res.rows[0];
};

module.exports = {
  findByEmail,
  findById,
  createUser,
};

