const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// --- image upload setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

// GET /api/products  (public - optional ?category=shirts)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id (public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products (admin only) - name, price, category, description, image file
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    if (!name || !price || !category || !req.file) {
      return res.status(400).json({ error: "name, price, category and image are all required" });
    }
    const product = await Product.create({
      name,
      price,
      category,
      description,
      image: `/uploads/${req.file.filename}`,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;