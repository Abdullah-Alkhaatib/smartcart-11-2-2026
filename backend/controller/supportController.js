const {Support} = require('../model/SupportModel.js');

// Create send message (user or admin)
const sendMessage = async (req, res) => {
    try {
        const {userId, sender, message} = req.body;

        if (!userId || !sender || !message) {
            return res.status(400).json({error: 'All fields are required'});
        }

        const newMessage = new Support({userId, sender, message});
        await newMessage.save();

        res.status(201).json({message: 'Message sent successfully', newMessage});

    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Get all messages for a user (جلب كل الرسائل الخاصة بمستخدم معين)
const getUserMessages = async (req, res) => {
    try {
        const {userId} = req.params;
        if (!userId) {
            return res.status(400).json({error: 'User ID is required'});
        }

        const messages = await Support.find({userId}).sort({createdAt: 1}); // جلب الرسائل وترتيبها حسب تاريخ الإنشاء
        res.status(200).json({messages});
        
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// جلب رسائل اليوزر الحالي (من التوكن) get messages for current user (from token)
const getMyMessages = async (req, res) => {
    try {
        const userId = req.user._id; // يعني جلب اليوزر آي دي من التوكن

        const messages = await Support.find({userId}).sort({createdAt: 1}); // جلب الرسائل وترتيبها حسب تاريخ الإنشاء
        res.status(200).json({messages});
        
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// get all messages (admin) (جلب كل المحادثات للأدمن (كل المستخدمين))
const getAllConversations = async (req, res) => {
    try {
        const conversations = await Support.aggregate([ // استخدام التجميع (aggregation) لجلب آخر رسالة لكل مستخدم
            {
                $group: {
                    _id: "$userId", // يعني تجميع الرسائل حسب اليوزر آي دي
                    lastMessage: { $last: "$message" }, // يعني جلب آخر رسالة لكل مستخدم
                    lastSender: { $last: "$sender" }, // يعني جلب آخر مرسل لكل مستخدم
                    updatedAt: { $last: "$updatedAt" } // يعني جلب آخر تاريخ تحديث لكل مستخدم
                },
            },
            { $sort: { updatedAt: -1 } },
            {
              $lookup: {
                from: "users", // اسم الكولكشن تبع المستخدمين في MongoDB
                localField: "_id", // يعني جلب اليوزر آي دي من التجميع
                foreignField: "_id", // يعني جلب اليوزر آي دي من كولكشن المستخدمين
                as: "user", // يعني تخزين النتيجة في حقل جديد اسمه "user"
              },
            },
            {
              $project: { // يعني تحديد الحقول اللي نريد نرجعها في النتيجة
                _id: 1, // يعني جلب اليوزر آي دي
                lastMessage: 1, // يعني جلب آخر رسالة
                lastSender: 1, // يعني جلب آخر مرسل
                updatedAt: 1, // يعني جلب آخر تاريخ تحديث
                userName: { $arrayElemAt: ["$user.username", 0] }, // يعني جلب اسم المستخدم من حقل "user" اللي جلبناه في الخطوة السابقة (بما أنه ممكن يكون فيه أكثر من مستخدم بنفس اليوزر آي دي، نستخدم $arrayElemAt لجلب أول عنصر فقط)
              },
            },
          ]);

        res.status(200).json(conversations);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    getUserMessages,
    getMyMessages,
    getAllConversations
};