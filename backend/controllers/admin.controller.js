const { query } = require("../config/db");

async function listPendingProducts(_req, res, next) {
  try {
    const rows = await query(
      `SELECT p.id, p.name, p.category, p.price, p.stock, p.created_at,
              v.store_name AS vendor_name
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.status = 'pending'
       ORDER BY p.created_at DESC`
    );

    res.json({ success: true, products: rows });
  } catch (error) {
    next(error);
  }
}

async function updateProductStatus(req, res, next) {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      const error = new Error("Status must be approved or rejected");
      error.statusCode = 400;
      throw error;
    }

    await query(
      `UPDATE products
       SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE approved_at END
       WHERE id = ?`,
      [status, status, productId]
    );

    res.json({
      success: true,
      message: `Product ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
}

async function listVendors(_req, res, next) {
  try {
    const rows = await query(
      `SELECT v.id, v.store_name, v.status, v.commission_rate, v.created_at,
              u.name AS owner_name, u.email,
              COUNT(DISTINCT p.id) AS products_count
       FROM vendors v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN products p ON p.vendor_id = v.id
       GROUP BY v.id, v.store_name, v.status, v.commission_rate, v.created_at, u.name, u.email
       ORDER BY v.id`
    );

    res.json({ success: true, vendors: rows });
  } catch (error) {
    next(error);
  }
}

async function listProducts(_req, res, next) {
  try {
    const rows = await query(
      `SELECT p.id, p.name, p.category, p.price, p.stock, p.status, p.image_url,
              v.store_name AS vendor_name
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       ORDER BY p.id`
    );

    res.json({ success: true, products: rows });
  } catch (error) {
    next(error);
  }
}

async function listUsers(_req, res, next) {
  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              COUNT(DISTINCT o.id) AS orders_count,
              MAX(v.status) AS vendor_status
       FROM users u
       LEFT JOIN orders o ON o.customer_id = u.id
       LEFT JOIN vendors v ON v.user_id = u.id
       GROUP BY u.id, u.name, u.email, u.role, u.created_at
       ORDER BY u.id`
    );

    res.json({ success: true, users: rows });
  } catch (error) {
    next(error);
  }
}

async function listOrders(_req, res, next) {
  try {
    const rows = await query(
      `SELECT o.id, o.total_amount, o.order_status, o.payment_status, o.created_at,
              u.name AS customer_name,
              GROUP_CONCAT(DISTINCT v.store_name ORDER BY v.store_name SEPARATOR ', ') AS vendor,
              GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS product
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN vendors v ON v.id = oi.vendor_id
       LEFT JOIN products p ON p.id = oi.product_id
       GROUP BY o.id, o.total_amount, o.order_status, o.payment_status, o.created_at, u.name
       ORDER BY o.id DESC`
    );

    res.json({ success: true, orders: rows });
  } catch (error) {
    next(error);
  }
}

async function updateVendorStatus(req, res, next) {
  try {
    const { vendorId } = req.params;
    const { status } = req.body;

    if (!["approved", "banned", "rejected", "pending"].includes(status)) {
      const error = new Error("Invalid vendor status");
      error.statusCode = 400;
      throw error;
    }

    await query(
      `UPDATE vendors
       SET status = ?
       WHERE id = ?`,
      [status, vendorId]
    );

    res.json({
      success: true,
      message: `Vendor ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
}

async function listComplaints(_req, res, next) {
  try {
    const rows = await query(
      `SELECT c.id, c.type, c.message, c.priority, c.status, c.created_at,
              c.order_id,
              cu.name AS customer_name,
              v.store_name AS vendor_name
       FROM complaints c
       LEFT JOIN users cu ON cu.id = c.customer_id
       LEFT JOIN vendors v ON v.id = c.vendor_id
       ORDER BY c.created_at DESC`
    );

    res.json({ success: true, complaints: rows });
  } catch (error) {
    next(error);
  }
}

async function updateComplaintStatus(req, res, next) {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    if (!["open", "inprogress", "resolved", "closed"].includes(status)) {
      const error = new Error("Invalid complaint status");
      error.statusCode = 400;
      throw error;
    }

    await query(
      `UPDATE complaints
       SET status = ?
       WHERE id = ?`,
      [status, complaintId]
    );

    res.json({
      success: true,
      message: `Complaint ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalytics(_req, res, next) {
  try {
    const [summary] = await query(
      `SELECT
         COALESCE(SUM(total_amount), 0) AS gross_revenue,
         COUNT(*) AS total_orders,
         COALESCE(AVG(total_amount), 0) AS average_order_value
       FROM orders`
    );

    const [commission] = await query(
      `SELECT COALESCE(SUM(commission_amount), 0) AS net_profit
       FROM order_items`
    );

    const salesTrend = await query(
      `SELECT DATE(created_at) AS day,
              COALESCE(SUM(total_amount), 0) AS revenue,
              COUNT(*) AS orders
       FROM orders
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY day ASC`
    );

    const topCategories = await query(
      `SELECT p.category AS label,
              COALESCE(SUM(oi.gross_amount), 0) AS value
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       GROUP BY p.category
       ORDER BY value DESC
       LIMIT 5`
    );

    const paymentSources = await query(
      `SELECT payment_method AS label,
              COUNT(*) AS value
       FROM orders
       GROUP BY payment_method
       ORDER BY value DESC`
    );

    res.json({
      success: true,
      analytics: {
        grossRevenue: Number(summary.gross_revenue || 0),
        netProfit: Number(commission.net_profit || 0),
        averageOrderValue: Number(summary.average_order_value || 0),
        conversionRate: Number(summary.total_orders || 0) > 0 ? 100 : 0,
        salesTrend,
        topCategories,
        paymentSources
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getSettings(_req, res, next) {
  try {
    const rows = await query(
      `SELECT *
       FROM platform_settings
       WHERE id = 1
       LIMIT 1`
    );

    res.json({ success: true, settings: rows[0] || null });
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const settings = req.body || {};

    await query(
      `UPDATE platform_settings
       SET platform_name = ?,
           support_email = ?,
           currency_code = ?,
           timezone_name = ?,
           maintenance_mode = ?,
           smtp_host = ?,
           smtp_port = ?,
           email_notifications = ?,
           two_factor_enabled = ?,
           login_notifications = ?,
           session_timeout_minutes = ?,
           payment_gateway_name = ?,
           default_commission_rate = ?,
           tax_rate = ?,
           min_payout_amount = ?,
           payout_frequency = ?
       WHERE id = 1`,
      [
        settings.platformName || "MultiMart",
        settings.supportEmail || "support@multimart.com",
        settings.currencyCode || "INR",
        settings.timezoneName || "IST",
        Boolean(settings.maintenanceMode),
        settings.smtpHost || null,
        Number(settings.smtpPort || 587),
        Boolean(settings.emailNotifications),
        Boolean(settings.twoFactorEnabled),
        Boolean(settings.loginNotifications),
        Number(settings.sessionTimeoutMinutes || 30),
        settings.paymentGatewayName || "Stripe",
        Number(settings.defaultCommissionRate || 10),
        Number(settings.taxRate || 5),
        Number(settings.minPayoutAmount || 100),
        settings.payoutFrequency || "monthly"
      ]
    );

    const rows = await query(
      `SELECT *
       FROM platform_settings
       WHERE id = 1
       LIMIT 1`
    );

    res.json({
      success: true,
      message: "Platform settings updated successfully",
      settings: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listVendors,
  listProducts,
  listUsers,
  listOrders,
  listComplaints,
  updateComplaintStatus,
  getAnalytics,
  getSettings,
  updateSettings,
  listPendingProducts,
  updateProductStatus,
  updateVendorStatus
};
