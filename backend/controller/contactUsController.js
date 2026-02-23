const { ContactUs } = require("../model/ContactUsModel.js");

// Create a new contact message
const sendMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Create and save the contact message
        const newMessage = new ContactUs({ name, email, message });
        await newMessage.save();

        res.status(201).json({ message: "Message sent successfully" });

    } catch (error) {
        res.status(500).json({error: error.message})
    }
};

// get all contact messages (for admin)
const getAllMessages = async (req, res) => {
    try {
        const messages = await ContactUs.find().sort({ createdAt: -1 }); // -1 يعني ترتيب تنازلي
        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({error: error.message})
    }
};

// delete a contact message (for admin)
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedMessage = await ContactUs.findByIdAndDelete(id);

        if (!deletedMessage) {
            return res.status(404).json({ error: "Message not found" });
        }

        res.status(200).json({ message: "Message deleted successfully" });

    } catch (error) {
        res.status(500).json({error: error.message})   
    }
};

module.exports = {
    sendMessage,
    getAllMessages,
    deleteMessage,
};