const { query } = require("../config/db.config");

const listProducts = async () => {
  const res = await query(
    "SELECT id, slug, base_price, discount_percent, stock, is_active, category_id FROM products ORDER BY id"
  );
  return res.rows;
};

const getProductById = async (id) => {
  const res = await query(
    "SELECT id, slug, base_price, discount_percent, stock, is_active, category_id FROM products WHERE id = $1",
    [id]
  );
  return res.rows[0] || null;
};

const createProduct = async ({
  slug,
  basePrice,
  discountPercent,
  stock,
  categoryId,
}) => {
  const res = await query(
    `INSERT INTO products (slug, base_price, discount_percent, stock, is_active, category_id)
     VALUES ($1, $2, $3, $4, true, $5)
     RETURNING id, slug, base_price, discount_percent, stock, is_active, category_id`,
    [slug, basePrice, discountPercent, stock, categoryId]
  );
  return res.rows[0];
};

const deleteProduct = async (id) => {
  await query("DELETE FROM products WHERE id = $1", [id]);
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  deleteProduct,
};

