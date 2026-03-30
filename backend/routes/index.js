const express = require("express");

const authRoutes = require("./auth.routes");
const productRoutes = require("./product.routes");
const orderRoutes = require("./order.routes");
const dashboardRoutes = require("./dashboard.routes");
const adminRoutes = require("./admin.routes");
const publicRoutes = require("./public.routes");

const router = express.Router();

// Mount all routes under /api
router.use("/api/auth", authRoutes);
router.use("/api/products", productRoutes);
router.use("/api/orders", orderRoutes);
router.use("/api/dashboard", dashboardRoutes);
router.use("/api/admin", adminRoutes);
router.use("/api/public", publicRoutes);

module.exports = router;
