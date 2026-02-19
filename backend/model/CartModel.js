const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    priceAtTime: { // نخزن السعر وقت إضافة المنتج إلى السلة، لأنه ممكن يتغير بعدين
      type: Number,
      required: true, // نخزن السعر وقت الإضافة
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.virtual("totalPrice").get(function () { // نحسب السعر الإجمالي بناءً على السعر وقت الإضافة والكمية لكل منتج
  return this.items.reduce(
    (total, item) => total + item.priceAtTime * item.quantity, // نضيف سعر كل منتج مضروبًا في كميته إلى الإجمالي
    0 // نبدأ من صفر ونجمع سعر كل منتج مضروبًا في كميته
  );
});

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = { Cart };