const express = require("express");
const router = express.Router();

const {
    sendMessage,
    getUserMessages,
    getMyMessages,
    getAllConversations
} = require("../controller/supportController.js");
const { verifyToken, verifyAdmin} = require("../middleware/verifyToken.js");
const validObjectId = require("../middleware/validObjectId.js");

//  /api/support/send-message (user or admin)
router.post("/send-message", verifyToken, sendMessage);   

//  /api/support/user-messages (جلب كل الرسائل الخاصة بمستخدم معين)
router.get("/user-messages", verifyToken, getMyMessages);

//  /api/support/user-messages/:userId (جلب كل الرسائل الخاصة بمستخدم معين (للأدمن))
router.get("/user-messages/:userId", verifyAdmin, validObjectId, getUserMessages);

//  /api/support/all-conversations (جلب كل المحادثات للأدمن (كل المستخدمين))
router.get("/all-conversations", verifyAdmin, getAllConversations);

module.exports = router;