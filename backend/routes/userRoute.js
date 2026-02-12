const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updatePassword,
} = require("../controller/userController");
const {
  verifyToken,
  verifyAdmin,
  verifyTokenAndAuthorization,
} = require("../middleware/verifyToken");
const validObjectId = require("../middleware/validObjectId");
const upload = require("../middleware/photoUpload"); // استيراد middleware للصور

// Routes

// POST /api/users/create-user - Create new user (Admin only)
router.post("/create-user", verifyAdmin, upload.single("profilePicture"), createUser);

// GET /api/users/get-all-users - Get all users (Admin only)
router.get("/get-all-users", verifyAdmin, getAllUsers);

// GET /api/users/profile - Get current user profile
router.get("/profile", verifyToken, getUserProfile);

// PUT /api/users/password - Update password
router.put("/password", verifyToken, updatePassword);

// GET /api/users/get-single/:id - Get single user (Admin or user themselves)
router.get("/get-single/:id", validObjectId, verifyTokenAndAuthorization, getSingleUser);

// PUT /api/users/update-user/:id - Update user (Admin or user themselves)
router.put(
  "/update-user/:id",
  validObjectId,
  verifyTokenAndAuthorization,
  upload.single("profilePicture"),
  updateUser,
);

// DELETE /api/users/delete-user/:id - Delete user (Admin only)
router.delete("/delete-user/:id", validObjectId, verifyAdmin, deleteUser);

module.exports = router;
