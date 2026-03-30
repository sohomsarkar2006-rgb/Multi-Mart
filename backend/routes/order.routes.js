const express = require("express");

const OrderController = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/", requireAuth, requireRole("customer"), OrderController.createOrder);
router.get("/vendor", requireAuth, requireRole("vendor"), OrderController.getVendorOrders);
router.patch("/:orderId/status", requireAuth, requireRole("admin", "vendor"), OrderController.updateOrderStatus);

module.exports = router;
