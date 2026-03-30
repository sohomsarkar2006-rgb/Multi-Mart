const express = require("express");

const AdminController = require("../controllers/admin.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/vendors", AdminController.listVendors);
router.patch("/vendors/:vendorId/status", AdminController.updateVendorStatus);
router.get("/products", AdminController.listProducts);
router.get("/products/pending", AdminController.listPendingProducts);
router.patch("/products/:productId/status", AdminController.updateProductStatus);
router.get("/users", AdminController.listUsers);
router.get("/orders", AdminController.listOrders);
router.get("/complaints", AdminController.listComplaints);
router.patch("/complaints/:complaintId/status", AdminController.updateComplaintStatus);
router.get("/analytics", AdminController.getAnalytics);
router.get("/settings", AdminController.getSettings);
router.patch("/settings", AdminController.updateSettings);

module.exports = router;
