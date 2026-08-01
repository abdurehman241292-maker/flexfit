const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { requireAdmin } = require("../middleware/auth");
const { sendOrderNotification } = require("../utils/mailer");

// POST /api/orders (public) - customer places an order with multiple cart items
router.post("/", async (req, res) => {
  try {
    const { items, customerName, phone, address, city, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      const qty = item.quantity || 1;
      totalAmount += product.price * qty;
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        size: item.size || "N/A",
      });
    }

    if (!orderItems.length) {
      return res.status(400).json({ error: "No valid products in cart" });
    }

    const order = await Order.create({
      items: orderItems,
      totalAmount,
      customerName,
      phone,
      address,
      city,
      notes,
    });

    // Respond immediately - don't make the customer wait on email
    res.status(201).json({ success: true, orderId: order._id });

    // Send email notification in the background
    sendOrderNotification(order).catch((mailErr) => {
      console.error("Email notification failed:", mailErr.message);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders (admin only)
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