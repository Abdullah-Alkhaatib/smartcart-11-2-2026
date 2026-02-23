// Support Model
const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: { // عشان نحدد مين المرسل
        type: String,
        required: true,
        enum: ['user', 'admin'] // عشان نحدد مين المرسل هل هو المستخدم العادي ولا الادمن
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true } 
);

const Support = mongoose.model('Support', supportSchema);

module.exports = {Support};