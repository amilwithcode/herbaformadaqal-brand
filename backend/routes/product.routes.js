const express = require("express");
const ProductController = require("../controllers/product.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", ProductController.list);
router.get("/:id", ProductController.getOne);
router.post("/", authMiddleware, ProductController.create);
router.delete("/:id", authMiddleware, ProductController.remove);

module.exports = router;

