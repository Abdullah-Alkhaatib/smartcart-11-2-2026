// product model
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
        max: 100, // 100%
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    images: [{
        type: String,
        required: false,
    }],
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// to calculate discounted after price
productSchema.virtual('finalPrice').get(function() { // virtual field => يعني مش مخزّن في الداتا بيس لكن بيتحسب لما نحتاجه , get يعني لما نطلبه
    if(!this.discount || this.discount === 0) return this.price; // لو مفيش خصم، السعر النهائي هو نفس السعر الأصلي
    const discountAmount = (this.price * this.discount) / 100; // حساب قيمة الخصم
    return this.price - discountAmount; // السعر النهائي بعد الخصم
});

productSchema.set('toJSON', { virtuals: true }); // عشان لما نحول الدوكومنت لجيسون، نضمن إن الفيلد الافتراضي يظهر
productSchema.set('toObject', { virtuals: true }); // عشان لما نحول الدوكومنت لأوبجكت، نضمن إن الفيلد الافتراضي يظهر

const Product = mongoose.model('Product', productSchema);

module.exports = { Product };