const ProductModel = require("../models/product.model");

async function getApprovedProducts(_req, res, next) {
  try {
    const products = await ProductModel.listApprovedProducts();
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

async function getVendorProducts(req, res, next) {
  try {
    const products = await ProductModel.listVendorProducts(req.user.id);
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

async function createVendorProduct(req, res, next) {
  try {
    const product = await ProductModel.createVendorProduct(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Product submitted for approval",
      product
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getApprovedProducts,
  getVendorProducts,
  createVendorProduct
};
