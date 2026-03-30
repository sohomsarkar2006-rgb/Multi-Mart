const { pool, query } = require("../config/db");

function getCommissionRate() {
  return Number(process.env.DEFAULT_COMMISSION_RATE || 10) / 100;
}

async function createOrder({ customerId, paymentMethod, shippingAddress, items }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const productIds = items.map((item) => item.productId);
    const placeholders = productIds.map(() => "?").join(", ");
    const [products] = await connection.execute(
      `SELECT p.id, p.name, p.price, p.stock, p.vendor_id, v.commission_rate
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.id IN (${placeholders}) AND p.status = 'approved'
       FOR UPDATE`,
      productIds
    );

    if (products.length !== items.length) {
      const error = new Error("Some products are unavailable or not approved");
      error.statusCode = 400;
      throw error;
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    let subtotal = 0;
    const commissionRateFallback = getCommissionRate();

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        const error = new Error(`Product not found: ${item.productId}`);
        error.statusCode = 404;
        throw error;
      }

      if (product.stock < item.quantity) {
        const error = new Error(`Insufficient stock for ${product.name}`);
        error.statusCode = 400;
        throw error;
      }

      subtotal += Number(product.price) * Number(item.quantity);
    }

    const tax = Number((subtotal * 0.05).toFixed(2));
    const shipping = subtotal >= 75 ? 0 : 5.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (customer_id, subtotal, tax_amount, shipping_amount, total_amount, payment_method, payment_status, order_status, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)`,
      [customerId, subtotal, tax, shipping, total, paymentMethod, shippingAddress]
    );

    for (const item of items) {
      const product = productMap.get(item.productId);
      const gross = Number((Number(product.price) * Number(item.quantity)).toFixed(2));
      const commissionRate = product.commission_rate != null
        ? Number(product.commission_rate) / 100
        : commissionRateFallback;
      const commission = Number((gross * commissionRate).toFixed(2));
      const vendorNet = Number((gross - commission).toFixed(2));

      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, vendor_id, quantity, unit_price, gross_amount,
          commission_amount, vendor_earning, item_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          orderResult.insertId,
          product.id,
          product.vendor_id,
          item.quantity,
          product.price,
          gross,
          commission,
          vendorNet
        ]
      );

      await connection.execute(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [item.quantity, product.id]
      );
    }

    await connection.execute(
      `INSERT INTO payments (order_id, customer_id, amount, payment_method, payment_status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [orderResult.insertId, customerId, total, paymentMethod]
    );

    await connection.commit();

    const rows = await query(
      `SELECT id, customer_id, subtotal, tax_amount, shipping_amount, total_amount,
              payment_method, payment_status, order_status, shipping_address, created_at
       FROM orders
       WHERE id = ?`,
      [orderResult.insertId]
    );

    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listVendorOrders(userId) {
  return query(
    `SELECT o.id, o.total_amount, o.payment_status, o.order_status, o.shipping_address, o.created_at,
            u.name AS customer_name,
            oi.product_id, oi.quantity, oi.unit_price, oi.gross_amount, oi.commission_amount, oi.vendor_earning,
            p.name AS product_name
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN vendors v ON v.id = oi.vendor_id
     JOIN products p ON p.id = oi.product_id
     WHERE v.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );
}

async function updateOrderStatus({ orderId, status, userRole, userId }) {
  const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid order status");
    error.statusCode = 400;
    throw error;
  }

  if (userRole === "vendor") {
    const vendorRows = await query(
      `SELECT oi.order_id
       FROM order_items oi
       JOIN vendors v ON v.id = oi.vendor_id
       WHERE oi.order_id = ? AND v.user_id = ?
       LIMIT 1`,
      [orderId, userId]
    );

    if (!vendorRows[0]) {
      const error = new Error("Vendor does not own this order");
      error.statusCode = 403;
      throw error;
    }

    if (status !== "shipped") {
      const error = new Error("Vendors can only mark orders as shipped");
      error.statusCode = 403;
      throw error;
    }
  }

  await query(
    `UPDATE orders
     SET order_status = ?
     WHERE id = ?`,
    [status, orderId]
  );

  await query(
    `UPDATE order_items
     SET item_status = ?
     WHERE order_id = ?`,
    [status, orderId]
  );

  const rows = await query(
    `SELECT id, order_status, payment_status, updated_at
     FROM orders
     WHERE id = ?`,
    [orderId]
  );

  return rows[0] || null;
}

module.exports = {
  createOrder,
  listVendorOrders,
  updateOrderStatus
};
