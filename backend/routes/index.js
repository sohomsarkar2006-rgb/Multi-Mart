const express = require("express");

const authRoutes = require("./auth.routes");
const productRoutes = require("./product.routes");
const orderRoutes = require("./order.routes");
const dashboardRoutes = require("./dashboard.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
