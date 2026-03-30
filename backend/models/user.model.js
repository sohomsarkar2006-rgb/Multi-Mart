const { query } = require("../config/db");

async function findByEmail(email) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.created_at,
            v.store_name, v.status AS vendor_status
     FROM users u
     LEFT JOIN vendors v ON v.user_id = u.id
     WHERE u.email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function findById(id) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at, v.store_name, v.status AS vendor_status
     FROM users u
     LEFT JOIN vendors v ON v.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function createUser({
  name,
  email,
  passwordHash,
  role,
  storeName,
  storeAddress,
  regNumber
}) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role]
  );

  if (role === "vendor") {
    await query(
      `INSERT INTO vendors (user_id, store_name, store_address, registration_number, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [result.insertId, storeName || null, storeAddress || null, regNumber || null]
    );
  }

  return findById(result.insertId);
}

module.exports = {
  findByEmail,
  findById,
  createUser
};
