const { query } = require("../config/db");

async function listApprovedProducts() {
  return query(
    `SELECT p.id, p.name, p.description, p.category, p.price, p.stock, p.image_url AS image,
            p.status, p.created_at, v.id AS vendor_id, v.store_name AS vendor_name
     FROM products p
     JOIN vendors v ON v.id = p.vendor_id
     WHERE p.status = 'approved'
     ORDER BY p.created_at DESC`
  );
}

async function listVendorProducts(userId) {
  return query(
    `SELECT p.id, p.name, p.description, p.category, p.price, p.stock, p.image_url AS image,
            p.status, p.created_at, v.store_name AS vendor_name
     FROM products p
     JOIN vendors v ON v.id = p.vendor_id
     WHERE v.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );
}

async function createVendorProduct(userId, product) {
  const vendorRows = await query(
    `SELECT id FROM vendors WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  const vendor = vendorRows[0];

  if (!vendor) {
    const error = new Error("Vendor profile not found");
    error.statusCode = 404;
    throw error;
  }

  const result = await query(
    `INSERT INTO products (
      vendor_id, name, description, category, price, stock, image_url, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      vendor.id,
      product.name,
      product.description || "",
      product.category,
      product.price,
      product.stock,
      product.imageUrl || null
    ]
  );

  const rows = await query(
    `SELECT id, name, description, category, price, stock, image_url AS image, status, created_at
     FROM products
     WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
}

module.exports = {
  listApprovedProducts,
  listVendorProducts,
  createVendorProduct
};
