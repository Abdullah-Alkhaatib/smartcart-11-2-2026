const express = require("express");
const router = express.Router();

const {
    sendMessage,
    getAllMessages,
    deleteMessage,
} = require("../controller/contactUsController.js");
const { verifyAdmin } = require("../middleware/verifyToken.js");
const validObjectId = require("../middleware/validObjectId.js");

//  /api/contact/send-message
router.post("/send-message", sendMessage);

//  /api/contact/get-all-messages
router.get("/get-all-messages", verifyAdmin, getAllMessages);

//  /api/contact/delete-message/:id
router.delete("/delete-message/:id", verifyAdmin, validObjectId, deleteMessage);

module.exports = router;