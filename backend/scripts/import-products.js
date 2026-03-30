require("dotenv").config();

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const bcrypt = require("bcryptjs");

const { pool } = require("../config/db");

const VENDOR_DIRECTORY = {
  vendor_1: {
    userId: 2,
    vendorId: 1,
    name: "Tech Store",
    email: "vendor1@test.com",
    password: "vendor123",
    storeName: "Tech Paradise",
    storeAddress: "123 Market Street",
    regNumber: "REG-TECH-001",
    status: "approved",
    commissionRate: 10
  },
  vendor_2: {
    userId: 4,
    vendorId: 2,
    name: "Style Central Owner",
    email: "vendor2@test.com",
    password: "vendor123",
    storeName: "Style Central",
    storeAddress: "22 Fashion Avenue",
    regNumber: "REG-FASHION-002",
    status: "approved",
    commissionRate: 10
  },
  vendor_3: {
    userId: 5,
    vendorId: 3,
    name: "Home Hub Owner",
    email: "vendor3@test.com",
    password: "vendor123",
    storeName: "Home Hub",
    storeAddress: "45 Home Street",
    regNumber: "REG-HOME-003",
    status: "approved",
    commissionRate: 10
  },
  vendor_4: {
    userId: 6,
    vendorId: 4,
    name: "Fit Life Owner",
    email: "vendor4@test.com",
    password: "vendor123",
    storeName: "Fit Life",
    storeAddress: "9 Wellness Road",
    regNumber: "REG-FIT-004",
    status: "approved",
    commissionRate: 10
  },
  vendor_5: {
    userId: 7,
    vendorId: 5,
    name: "Book World Owner",
    email: "vendor5@test.com",
    password: "vendor123",
    storeName: "Book World",
    storeAddress: "17 Library Lane",
    regNumber: "REG-BOOK-005",
    status: "approved",
    commissionRate: 10
  }
};

function extractDefaultProducts() {
  const mainJsPath = path.resolve(__dirname, "../../js/main.js");
  const content = fs.readFileSync(mainJsPath, "utf8");
  const match = content.match(/const DEFAULT_PRODUCTS = \[(.*?)\];/s);

  if (!match) {
    throw new Error("Could not extract DEFAULT_PRODUCTS from js/main.js");
  }

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`products = [${match[1]}];`, sandbox);
  return sandbox.products;
}

async function ensureVendorAccounts(connection) {
  for (const vendorKey of Object.keys(VENDOR_DIRECTORY)) {
    const vendor = VENDOR_DIRECTORY[vendorKey];
    const passwordHash = await bcrypt.hash(vendor.password, 10);

    await connection.execute(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'vendor')
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         email = VALUES(email),
         role = VALUES(role)`,
      [vendor.userId, vendor.name, vendor.email, passwordHash]
    );

    await connection.execute(
      `INSERT INTO vendors (
         id, user_id, store_name, store_address, registration_number, status, commission_rate
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         store_name = VALUES(store_name),
         store_address = VALUES(store_address),
         registration_number = VALUES(registration_number),
         status = VALUES(status),
         commission_rate = VALUES(commission_rate)`,
      [
        vendor.vendorId,
        vendor.userId,
        vendor.storeName,
        vendor.storeAddress,
        vendor.regNumber,
        vendor.status,
        vendor.commissionRate
      ]
    );
  }
}

async function importProducts(connection, products) {
  for (const product of products) {
    const vendor = VENDOR_DIRECTORY[product.vendorId];
    if (!vendor) {
      throw new Error(`Unknown vendor mapping for ${product.vendorId}`);
    }

    const numericProductId = Number(String(product.id).replace(/\D+/g, ""));

    await connection.execute(
      `INSERT INTO products (
         id, vendor_id, name, description, category, price, stock, image_url, status, approved_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         vendor_id = VALUES(vendor_id),
         name = VALUES(name),
         description = VALUES(description),
         category = VALUES(category),
         price = VALUES(price),
         stock = VALUES(stock),
         image_url = VALUES(image_url),
         status = VALUES(status),
         approved_at = VALUES(approved_at),
         created_at = VALUES(created_at)`,
      [
        numericProductId,
        vendor.vendorId,
        product.name,
        product.description || "",
        product.category,
        Number(product.price || 0),
        Number(product.stock || 0),
        product.image || null,
        product.status || "approved",
        product.status === "approved" ? new Date(product.createdAt || Date.now()) : null,
        new Date(product.createdAt || Date.now())
      ]
    );
  }

  const maxProductId = Math.max(...products.map((product) => Number(String(product.id).replace(/\D+/g, ""))));
  await connection.query(`ALTER TABLE products AUTO_INCREMENT = ${maxProductId + 1}`);
}

async function run() {
  const products = extractDefaultProducts();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureVendorAccounts(connection);
    await importProducts(connection, products);
    await connection.commit();
    console.log(`Imported ${products.length} products into MySQL.`);
  } catch (error) {
    await connection.rollback();
    console.error("Product import failed:", error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

run();
