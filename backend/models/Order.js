const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        size: { type: String, default: "N/A" },
      },
    ],
    totalAmount: { type: Number, required: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: "" },
    notes: { type: String, default: "" },
    paymentMethod: { type: String, default: "Cash on Delivery" },
    status: { type: String, enum: ["new", "confirmed", "shipped", "cancelled"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);