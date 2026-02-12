const express = require("express");
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/categoryController.js");

const { verifyAdmin } = require("../middleware/verifyToken.js");
const validObjectId = require("../middleware/validObjectId.js");
const upload = require("../middleware/photoUpload.js"); 

// Routes

// POST /api/categories/create-category - Create new category (Admin only)
router.post("/create-category", verifyAdmin, upload.single("image"), createCategory);

// GET /api/categories/get-all-categories - Get all active categories
router.get("/get-all-categories", getAllCategories);

// GET /api/categories/get-single-category/:id - Get single category by ID
router.get("/get-single-category/:id", validObjectId, getSingleCategory);

// PUT /api/categories/update-category/:id - Update category (Admin only)
router.put(
  "/update-category/:id",
  validObjectId,
  verifyAdmin,
  upload.single("image"),
  updateCategory
);

// DELETE /api/categories/delete-category/:id - Delete category (Soft delete - Admin only)
router.delete("/delete-category/:id", validObjectId, verifyAdmin, deleteCategory);

module.exports = router;
