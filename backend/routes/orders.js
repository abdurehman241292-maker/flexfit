const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { requireAdmin } = require("../middleware/auth");
const { sendOrderNotification } = require("../utils/mailer");

// POST /api/orders (public) - customer places an order
router.post("/", async (req, res) => {
  try {
    const { productId, quantity, size, customerName, phone, address, notes } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const order = await Order.create({
      product: product._id,
      productName: product.name,
      productPrice: product.price,
      quantity: quantity || 1,
      size: size || "N/A",
      customerName,
      phone,
      address,
      notes,
    });

    // Send email notification - don't fail the order if email fails
    try {
      await sendOrderNotification(order);
    } catch (mailErr) {
      console.error("Email notification failed:", mailErr.message);
    }

    res.status(201).json({ success: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders (admin only) - view all orders
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id (admin only) - update status
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;