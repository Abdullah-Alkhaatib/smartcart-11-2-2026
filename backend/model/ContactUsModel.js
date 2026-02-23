const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        // match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        maxlength: [1000, "Message is too long"],
    },
}, { timestamps: true });

const ContactUs = mongoose.model("ContactUs", contactUsSchema);

module.exports = {ContactUs};