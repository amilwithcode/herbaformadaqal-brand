const Product = require("../models/product.model");

const list = async (req, res, next) => {
  try {
    const items = await Product.listProducts();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "ID düzgün deyil" });
    }
    const product = await Product.getProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { slug, basePrice, discountPercent, stock, categoryId } = req.body;
    if (!slug || basePrice == null) {
      return res.status(400).json({ message: "Slug və qiymət tələb olunur" });
    }
    const item = await Product.createProduct({
      slug,
      basePrice: Number(basePrice) || 0,
      discountPercent: Number(discountPercent) || 0,
      stock: Number(stock) || 0,
      categoryId: categoryId ? Number(categoryId) : null,
    });
    res.status(201).json(item);
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
    await Product.deleteProduct(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getOne,
  create,
  remove,
};

