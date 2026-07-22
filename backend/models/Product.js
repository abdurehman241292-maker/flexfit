const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ["shirts", "caps", "trousers", "jackets"],
    },
    image: { type: String, required: true }, // stored path e.g. /uploads/filename.jpg
    description: { type: String, default: "" },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);