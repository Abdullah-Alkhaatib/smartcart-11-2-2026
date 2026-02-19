const express = require("express");
const router = express.Router();

const {
	addToCart,
	getMyCart,
	updateCartItem,
	removeCartItem,
	clearCart,
} = require("../controller/cartController.js");

const { verifyToken } = require("../middleware/verifyToken.js");

// Routes

// POST /api/cart/add-to-cart - Add item to cart
router.post("/add-to-cart", verifyToken, addToCart);

// GET /api/cart/get-my-cart - Get current user's cart
router.get("/get-my-cart", verifyToken, getMyCart);

// PUT /api/cart/update-cart-item - Update item quantity in cart
router.put("/update-cart-item", verifyToken, updateCartItem);

// DELETE /api/cart/remove-cart-item - Remove item from cart
router.delete("/remove-cart-item", verifyToken, removeCartItem);

// DELETE /api/cart/clear-cart - Clear cart
router.delete("/clear-cart", verifyToken, clearCart);

module.exports = router;
