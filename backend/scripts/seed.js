require("dotenv").config();

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

async function seed() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const accounts = [
      {
        name: "John Doe",
        email: "customer@test.com",
        password: "password123",
        role: "customer"
      },
      {
        name: "Tech Store",
        email: "vendor1@test.com",
        password: "vendor123",
        role: "vendor",
        storeName: "Tech Paradise",
        storeAddress: "123 Market Street",
        regNumber: "REG-TECH-001",
        status: "approved"
      },
      {
        name: "Administrator",
        email: "admin@gmail.com",
        password: "123456",
        role: "admin"
      }
    ];

    for (const account of accounts) {
      const passwordHash = await bcrypt.hash(account.password, 10);

      const [existingRows] = await connection.execute(
        `SELECT id FROM users WHERE email = ? LIMIT 1`,
        [account.email]
      );

      let userId = existingRows[0]?.id;

      if (!userId) {
        const [insertUser] = await connection.execute(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES (?, ?, ?, ?)`,
          [account.name, account.email, passwordHash, account.role]
        );
        userId = insertUser.insertId;
      }

      if (account.role === "vendor") {
        const [vendorRows] = await connection.execute(
          `SELECT id FROM vendors WHERE user_id = ? LIMIT 1`,
          [userId]
        );

        if (!vendorRows[0]) {
          await connection.execute(
            `INSERT INTO vendors (user_id, store_name, store_address, registration_number, status, commission_rate)
             VALUES (?, ?, ?, ?, ?, 10.00)`,
            [
              userId,
              account.storeName,
              account.storeAddress,
              account.regNumber,
              account.status
            ]
          );
        }
      }
    }

    const [vendorRows] = await connection.execute(
      `SELECT id FROM vendors WHERE store_name = 'Tech Paradise' LIMIT 1`
    );

    const vendorId = vendorRows[0]?.id;

    if (vendorId) {
      const starterProducts = [
        {
          name: "Wireless Headphones",
          description: "High-quality wireless headphones",
          category: "Electronics",
          price: 2999,
          stock: 25,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
        },
        {
          name: "Smart Watch",
          description: "Fitness smartwatch",
          category: "Electronics",
          price: 4999,
          stock: 15,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
        }
      ];

      for (const product of starterProducts) {
        const [existingProducts] = await connection.execute(
          `SELECT id FROM products WHERE vendor_id = ? AND name = ? LIMIT 1`,
          [vendorId, product.name]
        );

        if (!existingProducts[0]) {
          await connection.execute(
            `INSERT INTO products (vendor_id, name, description, category, price, stock, image_url, status, approved_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', NOW())`,
            [
              vendorId,
              product.name,
              product.description,
              product.category,
              product.price,
              product.stock,
              product.imageUrl
            ]
          );
        }
      }
    }

    await connection.commit();
    console.log("Seed completed successfully.");
  } catch (error) {
    await connection.rollback();
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();
