const { query } = require("../config/db.config");

const listPosts = async () => {
  const res = await query(
    "SELECT id, title, excerpt, is_pinned, created_at FROM content_posts ORDER BY created_at DESC"
  );
  return res.rows;
};

const createPost = async ({ title, excerpt, isPinned }) => {
  const res = await query(
    `INSERT INTO content_posts (title, excerpt, is_pinned)
     VALUES ($1, $2, $3)
     RETURNING id, title, excerpt, is_pinned, created_at`,
    [title, excerpt, isPinned]
  );
  return res.rows[0];
};

const updatePost = async (id, { title, excerpt, isPinned }) => {
  const res = await query(
    `UPDATE content_posts
     SET title = COALESCE($2, title),
         excerpt = COALESCE($3, excerpt),
         is_pinned = COALESCE($4, is_pinned)
     WHERE id = $1
     RETURNING id, title, excerpt, is_pinned, created_at`,
    [id, title ?? null, excerpt ?? null, isPinned ?? null]
  );
  return res.rows[0] || null;
};

const deletePost = async (id) => {
  await query("DELETE FROM content_posts WHERE id = $1", [id]);
};

module.exports = {
  listPosts,
  createPost,
  updatePost,
  deletePost,
};

