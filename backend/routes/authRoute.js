const express = require('express');
const router = express.Router();

const {
    register,
    login,
    me,
    // refreshTokenHandler,
    // logout
} = require('../controller/authController.js');

const {verifyToken} = require('../middleware/verifyToken.js');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Get current user route
router.get('/me', verifyToken, me);

// Refresh token route
// router.post('/refresh-token', refreshTokenHandler);

// Logout route
// router.post('/logout', verifyToken, logout);

module.exports = router;