const express = require("express");
const AdminController = require("../controllers/admin.controller");

const router = express.Router();

// Public settings endpoints (no authentication required)
router.get("/settings/public", AdminController.getPublicSettings);
router.get("/settings/contact", AdminController.getContactInfo);

module.exports = router;
