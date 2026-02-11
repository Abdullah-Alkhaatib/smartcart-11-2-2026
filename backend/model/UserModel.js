// userModel.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'الرجاء إدخال بريد إلكتروني صحيح']
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6,
        select: false // عشان لما نجيب بيانات المستخدم ما يطلع لنا الباسورد
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^[0-9+\-\s()]+$/, 'الرجاء إدخال رقم هاتف صحيح']
    },
    profilePicture: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/previews/036/280/650/non_2x/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg",
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    // isVerified: {// عشان نعرف إذا كان المستخدم مفعل إيميله ولا لأ
    //     type: Boolean, 
    //     default: false
    // },
    address: [
        {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            postalCode: { type: String, trim: true }, // رمز بريدي
        }
    ],
}, { timestamps: true });

// Generate auth token
userSchema.methods.generateAuthToken = function() { // عشان نولد التوكن
    return jwt.sign({ _id: this._id, role: this.role}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN}); // عشان نستخدم الـ id والـ role في التوكن عشان نتحقق منهم بعدين
};

// Hash password before saving
userSchema.pre('save', async function(next) { // عشان نعمل هاش للباسورد قبل ما نحفظه في الداتا بيز
    if (!this.isModified('password')){
        return next(); // لو الباسورد ما تغيرش ما نعملش هاش جديد
    }

    const salt = await bcrypt.genSalt(10); // نولد سولت
    this.password = await bcrypt.hash(this.password, salt); // نعمل هاش للباسورد باستخدام السولت
    next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = { User };