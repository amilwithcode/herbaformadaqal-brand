const Blog = require("../models/blog.model");

const list = async (req, res, next) => {
  try {
    const posts = await Blog.listPosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { title, excerpt, isPinned } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Başlıq tələb olunur" });
    }
    const post = await Blog.createPost({
      title,
      excerpt: excerpt || "",
      isPinned: Boolean(isPinned),
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "ID düzgün deyil" });
    }
    const { title, excerpt, isPinned } = req.body;
    const post = await Blog.updatePost(id, {
      title,
      excerpt,
      isPinned: typeof isPinned === "boolean" ? isPinned : undefined,
    });
    if (!post) {
      return res.status(404).json({ message: "Post tapılmadı" });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "ID düzgün deyil" });
    }
    await Blog.deletePost(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
};

