const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    priceAtTime: { // نخزن السعر وقت إضافة المنتج إلى الطلب، لأنه ممكن يتغير بعدين
      type: Number,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema], 
      validate: [(val) => val.length > 0, "Order must have at least one item"], // نتحقق أن الطلب يحتوي على منتج واحد على الأقل
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
    },

    paymentMethod: { // نحدد طريقة الدفع
      type: String,
      enum: ["COD", "Card"],
      default: "COD",
    },

    paymentStatus: { // نحدد حالة الدفع
      type: String,
      enum: ["Pending", "Paid", "Failed"], // حالة الدفع: "Pending" يعني لم يتم الدفع بعد، "Paid" يعني تم الدفع بنجاح، "Failed" يعني فشل الدفع
      default: "Pending",
    },

    orderStatus: { // نحدد حالة الطلب
      type: String,
      enum: [
        "Pending", // الطلب تم إنشاؤه ولكن لم يتم تأكيده بعد
        "Confirmed", // الطلب تم تأكيده من قبل البائع
        "Shipped", // الطلب تم شحنه
        "Delivered", // الطلب تم تسليمه
        "Cancelled", // الطلب تم إلغاؤه من قبل المستخدم أو البائع
      ],
      default: "Pending",
      index: true,
    },

    paidAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

/*
  قبل الحفظ:
  - نحسب subtotal لكل منتج
  - نحسب totalPrice تلقائيًا
*/
orderSchema.pre("validate", function () {
  let total = 0;

  if (!Array.isArray(this.items)) {
    this.items = [];
    this.totalPrice = 0;
    return;
  }

  this.items.forEach((item) => {
    item.subtotal = item.priceAtTime * item.quantity;
    total += item.subtotal;
  });

  this.totalPrice = total;
});

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };