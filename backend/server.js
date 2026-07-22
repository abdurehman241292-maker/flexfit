require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      httpOnly: true,
    },
  })
);

// serve uploaded product images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// serve the frontend (index.html, admin pages, css, js)
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));
// Catch errors (like oversized file uploads) and always respond with JSON
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || "Something went wrong" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`FlexFit server running on port ${PORT}`));