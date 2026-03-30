const DashboardModel = require("../models/dashboard.model");

async function getAdminOverview(_req, res, next) {
  try {
    const overview = await DashboardModel.getAdminOverview();
    res.json({ success: true, overview });
  } catch (error) {
    next(error);
  }
}

async function getVendorOverview(req, res, next) {
  try {
    const overview = await DashboardModel.getVendorOverview(req.user.id);
    res.json({ success: true, overview });
  } catch (error) {
    next(error);
  }
}

async function getVendorPayouts(req, res, next) {
  try {
    const data = await DashboardModel.listVendorPayouts(req.user.id);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

async function requestVendorPayout(req, res, next) {
  try {
    const payout = await DashboardModel.createVendorPayoutRequest(req.user.id);
    res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully",
      payout
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminPayouts(_req, res, next) {
  try {
    const data = await DashboardModel.getAdminPayouts();
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

async function updateAdminPayoutStatus(req, res, next) {
  try {
    const payout = await DashboardModel.updatePayoutStatus(req.params.payoutId, req.body.status);
    res.json({
      success: true,
      message: `Payout ${req.body.status} successfully`,
      payout
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminOverview,
  getVendorOverview,
  getVendorPayouts,
  requestVendorPayout,
  getAdminPayouts,
  updateAdminPayoutStatus
};
