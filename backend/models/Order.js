const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: String,
    productPrice: Number,
    quantity: { type: Number, default: 1 },
    size: { type: String, default: "N/A" },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["new", "confirmed", "shipped", "cancelled"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);