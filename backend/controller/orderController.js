const mongoose = require("mongoose");
const { Order } = require("../model/OrderModel");
const { Cart } = require("../model/CartModel");
const { Product } = require("../model/ProductModel");

////////////////////////////////////////////////////
// ✅ Create Order (Checkout)
////////////////////////////////////////////////////
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !shippingAddress.phone) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Phone is required" });
    }

    const normalizedShippingAddress = {
      ...shippingAddress,
      phone: String(shippingAddress.phone).trim(),
    };

    if (!/^\d+$/.test(normalizedShippingAddress.phone)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Phone must contain digits only" });
    }

    const cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product || !product.isActive) {
        throw new Error("Product not available");
      }

      const variant = product.images.find(
        (img) => (img.color || "").trim() === (item.color || "").trim()
      );

      if (!variant || variant.stock < item.quantity) {
        throw new Error("Insufficient stock");
      }

      // 🔥 خصم المخزون
      variant.stock -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        color: item.color,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        subtotal: item.priceAtTime * item.quantity,
      });
    }

    const order = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          shippingAddress: normalizedShippingAddress,
          paymentMethod: paymentMethod || "COD",
        },
      ],
      { session }
    );

    // فضي السلة
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();

    res.status(201).json(order[0]);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

////////////////////////////////////////////////////
// ✅ Get My Orders (User) + Pagination
////////////////////////////////////////////////////
const getMyOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: req.user._id });

    res.status(200).json({
      page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// ✅ Get Single Order
////////////////////////////////////////////////////
const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "username email")
      .populate("items.product", "name images");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// ✅ Cancel Order (ويرجع المخزون)
////////////////////////////////////////////////////
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Unauthorized" });
    }

    const cancellableStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

    if (!cancellableStatuses.includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Only pending or confirmed orders can be cancelled",
      });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error("Product not found while restoring stock");
      }

      const variant = product.images.find(
        (img) => (img.color || "").trim() === (item.color || "").trim()
      );

      if (!variant) {
        throw new Error("Product variant not found while restoring stock");
      }

      variant.stock += item.quantity;

      await product.save({ session });
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = new Date();

    await order.save({ session });

    await session.commitTransaction();

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

////////////////////////////////////////////////////
// ✅ Admin: Get All Orders
////////////////////////////////////////////////////
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// ✅ Admin: Update Order Status
////////////////////////////////////////////////////
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ✅ إذا بدو يلغي الطلبية، استدعي cancelOrder
    if (status === "Cancelled") {
      return cancelOrder(req, res);
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = status;

    if (status === "Delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({ message: "Order status updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
module.exports = {
  createOrder,
  getMyOrders,
  getSingleOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};