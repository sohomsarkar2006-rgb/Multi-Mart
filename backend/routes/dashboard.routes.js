const express = require("express");

const DashboardController = require("../controllers/dashboard.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/admin", requireAuth, requireRole("admin"), DashboardController.getAdminOverview);
router.get("/admin/payouts", requireAuth, requireRole("admin"), DashboardController.getAdminPayouts);
router.patch("/admin/payouts/:payoutId/status", requireAuth, requireRole("admin"), DashboardController.updateAdminPayoutStatus);
router.get("/vendor", requireAuth, requireRole("vendor"), DashboardController.getVendorOverview);
router.get("/vendor/payouts", requireAuth, requireRole("vendor"), DashboardController.getVendorPayouts);
router.post("/vendor/payouts/request", requireAuth, requireRole("vendor"), DashboardController.requestVendorPayout);

module.exports = router;
