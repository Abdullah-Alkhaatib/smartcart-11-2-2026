const { Cart } = require("../model/CartModel");
const { Product } = require("../model/ProductModel");

const addToCart = async (req, res) => {
  try {
    const { productId, color, quantity } = req.body;
    const userId = req.user._id;
    const normalizedColor = typeof color === "string" ? color.trim() : "";
    const parsedQuantity = Number(quantity);

    if (!productId || !normalizedColor || !Number.isFinite(parsedQuantity)) {
      return res.status(400).json({ message: "Missing fields" });
    }
    if (parsedQuantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.images.find(
      (img) => (img.color || "").trim() === normalizedColor,
    );

    if (!variant) {
      return res.status(400).json({ message: "Color not available" });
    }

    if (parsedQuantity > (variant.stock || 0)) {
      return res.status(400).json({ message: "مخزون غير كاف" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId && item.color === normalizedColor,
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + parsedQuantity;
      if (nextQuantity > (variant.stock || 0)) {
        return res.status(400).json({ message: "مخزون غير كاف" });
      }
      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push({
        product: productId,
        color: normalizedColor,
        imageUrl: variant.url || "",
        quantity: parsedQuantity,
        priceAtTime: product.finalPrice ?? product.price,
        discountAtAdd: product.discount || 0,
      });
    }

    await cart.save();

    await cart
      .populate(
        "items.product",
        "name images price discount description category finalPrice isActive",
      )
      .then((c) => c.populate("items.product.category", "name"));

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get cart
const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate(
        "items.product",
        "name images price discount description category finalPrice isActive",
      )
      .populate("items.product.category", "name");

    if (!cart) {
      return res.status(200).json({ items: [], totalPrice: 0 });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update cart
const updateCartItem = async (req, res) => {
  try {
    const { productId, color, quantity } = req.body;
    const normalizedColor = typeof color === "string" ? color.trim() : "";
    const parsedQuantity = Number(quantity);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId && i.color === normalizedColor,
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.images.find(
      (img) => (img.color || "").trim() === normalizedColor,
    );

    if (!variant) {
      return res.status(400).json({ message: "Color not available" });
    }

    if (parsedQuantity > (variant.stock || 0)) {
      return res.status(400).json({ message: "مخزون غير كاف" });
    }

    item.quantity = parsedQuantity;

    await cart.save();

    await cart
      .populate(
        "items.product",
        "name images price discount description category finalPrice isActive",
      )
      .then((c) => c.populate("items.product.category", "name"));

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// remove from cart
const removeCartItem = async (req, res) => {
  try {
    const { productId, color } = req.body;
    const normalizedColor = typeof color === "string" ? color.trim() : "";

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.color === normalizedColor
        ),
    );

    await cart.save();

    await cart
      .populate(
        "items.product",
        "name images price discount description category finalPrice isActive",
      )
      .then((c) => c.populate("items.product.category", "name"));

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// clear cart => علشان ممكن المستخدم يضيف منتجات وبعدين يقرر يمسح كل حاجة ويرجع يضيف منتجات تانية، بدل ما يمسح كل منتج لوحده
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
