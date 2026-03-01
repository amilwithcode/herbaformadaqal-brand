const express = require("express");
const BlogController = require("../controllers/blog.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", BlogController.list);
router.post("/", authMiddleware, BlogController.create);
router.put("/:id", authMiddleware, BlogController.update);
router.delete("/:id", authMiddleware, BlogController.remove);

module.exports = router;

