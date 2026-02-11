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
        // match: [/^\S+@\S+\.\S+$/, 'الرجاء إدخال بريد إلكتروني صحيح']
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
            region : { type: String, trim: true },
            postalCode: { type: String, trim: true }, // رمز بريدي
        },
    ],
    refreshToken: {
        type: String,
        select: false // عشان لما نجيب بيانات المستخدم ما يطلع لنا الريفرش توكن
    }
}, { timestamps: true });

// Generate auth token
userSchema.methods.generateAccessToken = function () { // عشان نولد توكن جديد لما المستخدم يسجل دخول أو يجدد التوكن
    return jwt.sign(
        { _id: this._id, role: this.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
};

// Hash password before saving
userSchema.pre('save', async function() { // عشان نعمل هاش للباسورد قبل ما نحفظه في الداتا بيز
    if (!this.isModified('password')){
        return; // إذا الباسورد ما تم تعديله، ما نعمل هاش جديد
    }

    const salt = await bcrypt.genSalt(10); // نولد سولت
    this.password = await bcrypt.hash(this.password, salt); // نعمل هاش للباسورد باستخدام السولت
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = { User };