const OrderModel = require("../models/order.model");

async function createOrder(req, res, next) {
  try {
    const { paymentMethod, shippingAddress, items } = req.body;

    if (!paymentMethod || !shippingAddress || !Array.isArray(items) || !items.length) {
      const error = new Error("Order details are incomplete");
      error.statusCode = 400;
      throw error;
    }

    const order = await OrderModel.createOrder({
      customerId: req.user.id,
      paymentMethod,
      shippingAddress,
      items
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order
    });
  } catch (error) {
    next(error);
  }
}

async function getVendorOrders(req, res, next) {
  try {
    const orders = await OrderModel.listVendorOrders(req.user.id);
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      const error = new Error("Status is required");
      error.statusCode = 400;
      throw error;
    }

    const order = await OrderModel.updateOrderStatus({
      orderId,
      status,
      userRole: req.user.role,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: `Order marked as ${status}`,
      order
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getVendorOrders,
  updateOrderStatus
};
