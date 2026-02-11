const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authToken = req.headers.authorization; // عشان نجيب التوكن من الهيدر
    if( !authToken || !authToken.startsWith("Bearer ") ) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authToken.split(" ")[1]; // عشان نجيب التوكن نفسه من السترينج
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET); // عشان نتحقق من صحة التوكن
        req.user = { _id: decoded._id, role: decoded.role }; // عشان نحط بيانات المستخدم في الريكويست عشان نستخدمها بعدين
        next(); // عشان نكمل تنفيذ الريكويست
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

// verifyToken and admin role
function verifyAdmin(req, res, next) {
    verifyToken(req, res, () => { // عشان نتحقق من التوكن الأول
        if(req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied, admin only' });
        }
    });
};

// verifyToken and authorization (user can access their own data or admin can access any data)
const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user._id === req.params.id || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied, you are not authorized' });
        }
    });
};

module.exports = { verifyToken, verifyAdmin, verifyTokenAndAuthorization };