const { query } = require("../config/db");

async function getVendorIdentity(userId) {
  const rows = await query(
    `SELECT id, store_name
     FROM vendors
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function getAdminOverview() {
  const [revenueRow] = await query(
    `SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue
     FROM orders`
  );
  const [vendorRow] = await query(
    `SELECT COUNT(*) AS active_vendors FROM vendors WHERE status = 'approved'`
  );
  const [userRow] = await query(
    `SELECT COUNT(*) AS total_users FROM users`
  );
  const [commissionRow] = await query(
    `SELECT COALESCE(SUM(commission_amount), 0) AS total_commission FROM order_items`
  );
  const [pendingProductsRow] = await query(
    `SELECT COUNT(*) AS pending_products FROM products WHERE status = 'pending'`
  );

  return {
    totalRevenue: Number(revenueRow.total_revenue || 0),
    totalOrders: Number(revenueRow.total_orders || 0),
    activeVendors: Number(vendorRow.active_vendors || 0),
    totalUsers: Number(userRow.total_users || 0),
    totalCommission: Number(commissionRow.total_commission || 0),
    pendingProducts: Number(pendingProductsRow.pending_products || 0)
  };
}

async function getVendorOverview(userId) {
  const vendor = await getVendorIdentity(userId);
  if (!vendor) {
    const error = new Error("Vendor profile not found");
    error.statusCode = 404;
    throw error;
  }

  const [productStats] = await query(
    `SELECT COUNT(*) AS total_products
     FROM products
     WHERE vendor_id = ?`,
    [vendor.id]
  );

  const [orderStats] = await query(
    `SELECT
       COUNT(DISTINCT order_id) AS total_orders,
       COALESCE(SUM(vendor_earning), 0) AS total_earnings,
       COALESCE(SUM(CASE WHEN item_status = 'delivered' THEN vendor_earning ELSE 0 END), 0) AS delivered_earnings,
       COALESCE(SUM(CASE WHEN item_status IN ('pending', 'processing', 'shipped') THEN 1 ELSE 0 END), 0) AS pending_items
     FROM order_items
     WHERE vendor_id = ?`,
    [vendor.id]
  );

  const recentSales = await query(
    `SELECT DATE(o.created_at) AS day,
            COALESCE(SUM(oi.vendor_earning), 0) AS earnings,
            COUNT(DISTINCT oi.order_id) AS orders
     FROM vendors v
     LEFT JOIN order_items oi ON oi.vendor_id = v.id
     LEFT JOIN orders o ON o.id = oi.order_id
     WHERE v.user_id = ?
       AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY DATE(o.created_at)
     ORDER BY day ASC`,
    [userId]
  );

  const [payoutStats] = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_payouts,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_out
     FROM vendor_payouts
     WHERE vendor_id = ?`,
    [vendor.id]
  );

  const deliveredEarnings = Number(orderStats.delivered_earnings || 0);
  const pendingPayouts = Number(payoutStats.pending_payouts || 0);
  const paidOut = Number(payoutStats.paid_out || 0);
  const availableBalance = Math.max(0, Number((deliveredEarnings - pendingPayouts - paidOut).toFixed(2)));

  return {
    vendorId: vendor.id,
    storeName: vendor.store_name,
    totalProducts: Number(productStats.total_products || 0),
    totalOrders: Number(orderStats.total_orders || 0),
    totalEarnings: Number(orderStats.total_earnings || 0),
    deliveredEarnings,
    pendingItems: Number(orderStats.pending_items || 0),
    pendingPayouts,
    paidOut,
    availableBalance,
    trend: recentSales
  };
}

async function listVendorPayouts(userId) {
  const vendor = await getVendorIdentity(userId);
  if (!vendor) {
    const error = new Error("Vendor profile not found");
    error.statusCode = 404;
    throw error;
  }

  const payouts = await query(
    `SELECT id, amount, status, paid_at, created_at
     FROM vendor_payouts
     WHERE vendor_id = ?
     ORDER BY created_at DESC`,
    [vendor.id]
  );

  const overview = await getVendorOverview(userId);

  return {
    payouts,
    summary: {
      storeName: vendor.store_name,
      totalEarnings: overview.totalEarnings,
      deliveredEarnings: overview.deliveredEarnings,
      pendingPayouts: overview.pendingPayouts,
      paidOut: overview.paidOut,
      availableBalance: overview.availableBalance
    }
  };
}

async function createVendorPayoutRequest(userId) {
  const overview = await getVendorOverview(userId);

  if (overview.availableBalance <= 0) {
    const error = new Error("No withdrawable balance available yet");
    error.statusCode = 400;
    throw error;
  }

  const vendor = await getVendorIdentity(userId);
  const amount = Number(overview.availableBalance.toFixed(2));

  await query(
    `INSERT INTO vendor_payouts (vendor_id, amount, status)
     VALUES (?, ?, 'pending')`,
    [vendor.id, amount]
  );

  const rows = await query(
    `SELECT id, vendor_id, amount, status, paid_at, created_at
     FROM vendor_payouts
     WHERE vendor_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [vendor.id]
  );

  return rows[0];
}

async function getAdminPayouts() {
  const payouts = await query(
    `SELECT vp.id, vp.amount, vp.status, vp.paid_at, vp.created_at,
            v.id AS vendor_id, v.store_name, v.commission_rate
     FROM vendor_payouts vp
     JOIN vendors v ON v.id = vp.vendor_id
     GROUP BY vp.id, vp.amount, vp.status, vp.paid_at, vp.created_at, v.id, v.store_name, v.commission_rate
     ORDER BY vp.created_at DESC`
  );

  const [summary] = await query(
    `SELECT
       COALESCE(SUM(CASE
         WHEN vp.status = 'paid'
          AND vp.paid_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN vp.amount ELSE 0 END), 0) AS total_paid_this_month,
       COALESCE(SUM(CASE WHEN vp.status = 'pending' THEN vp.amount ELSE 0 END), 0) AS pending_payouts,
       COALESCE((SELECT SUM(commission_amount) FROM order_items), 0) AS commission_earned
     FROM vendor_payouts vp`
  );

  return {
    payouts,
    summary: {
      totalPaidThisMonth: Number(summary.total_paid_this_month || 0),
      pendingPayouts: Number(summary.pending_payouts || 0),
      commissionEarned: Number(summary.commission_earned || 0)
    }
  };
}

async function updatePayoutStatus(payoutId, status) {
  if (!["pending", "paid", "cancelled"].includes(status)) {
    const error = new Error("Invalid payout status");
    error.statusCode = 400;
    throw error;
  }

  await query(
    `UPDATE vendor_payouts
     SET status = ?,
         paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END
     WHERE id = ?`,
    [status, status, payoutId]
  );

  const rows = await query(
    `SELECT id, vendor_id, amount, status, paid_at, created_at
     FROM vendor_payouts
     WHERE id = ?`,
    [payoutId]
  );

  return rows[0] || null;
}

module.exports = {
  getAdminOverview,
  getVendorOverview,
  listVendorPayouts,
  createVendorPayoutRequest,
  getAdminPayouts,
  updatePayoutStatus
};
