const express = require("express");
const router = express.Router();

const {
	createOrder,
	getMyOrders,
	getSingleOrder,
	cancelOrder,
	getAllOrders,
	updateOrderStatus,
} = require("../controller/orderController");

const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");
const validObjectId = require("../middleware/validObjectId");

// User routes
//  /api/orders/create-order
router.post("/create-order", verifyToken, createOrder);
//  /api/orders/my-orders
router.get("/my-orders", verifyToken, getMyOrders);
//  /api/orders/getSingleOrder/:id
router.get("/getSingleOrder/:id", verifyToken, validObjectId, getSingleOrder);
//  /api/orders/cancel/:id
router.put("/cancel/:id", verifyToken, cancelOrder);

// Admin routes
//  /api/orders/getAllOrders
router.get("/getAllOrders", verifyAdmin, getAllOrders);
//  /api/orders/update-status/:id
router.put("/update-status/:id", verifyAdmin, validObjectId, updateOrderStatus);

module.exports = router;
