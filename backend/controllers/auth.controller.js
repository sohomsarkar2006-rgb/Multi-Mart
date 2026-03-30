const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserModel = require("../models/user.model");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || "change_this_secret",
    { expiresIn: "7d" }
  );
}

async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      const error = new Error("Email, password, and role are required");
      error.statusCode = 400;
      throw error;
    }

    const user = await UserModel.findByEmail(email);
    if (!user || user.role !== role) {
      const error = new Error("Invalid email, password, or role");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error("Invalid email, password, or role");
      error.statusCode = 401;
      throw error;
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.store_name || null,
        vendorStatus: user.vendor_status || null
      }
    });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      role,
      storeName,
      storeAddress,
      regNumber
    } = req.body;

    if (!name || !email || !password || !role) {
      const error = new Error("Name, email, password, and role are required");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email already exists");
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser({
      name,
      email,
      passwordHash,
      role,
      storeName,
      storeAddress,
      regNumber
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register
};
