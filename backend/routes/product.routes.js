const express = require("express");

const ProductController = require("../controllers/product.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", ProductController.getApprovedProducts);
router.get("/vendor", requireAuth, requireRole("vendor"), ProductController.getVendorProducts);
router.post("/", requireAuth, requireRole("vendor"), ProductController.createVendorProduct);

module.exports = router;
