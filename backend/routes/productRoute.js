const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteSoftProduct,
  deleteForceProduct,
  getArchivedProducts,
  restoreProduct,
  filterProductsByCategory,
  searchProducts,
  getProductsByCategory,
  filterProductsByPrice,
} = require("../controller/productController.js");

const { verifyAdmin } = require("../middleware/verifyToken.js");
const validObjectId = require("../middleware/validObjectId.js");
const upload = require("../middleware/photoUpload.js");

// Routes

// POST /api/products/create-product - Create new product (Admin only)
router.post(
  "/create-product",
  verifyAdmin,
  upload.array("images", 10),
  createProduct,
);

// GET /api/products/get-all-products - Get all active products
router.get("/get-all-products", getAllProducts);

// GET /api/products/get-single-product/:id - Get single product by ID
router.get("/get-single-product/:id", validObjectId, getSingleProduct);

// PUT /api/products/update-product/:id - Update product (Admin only)
router.put(
  "/update-product/:id",
  validObjectId,
  verifyAdmin,
  upload.array("images", 10),
  updateProduct,
);

// DELETE /api/products/delete-soft-product/:id - Soft delete product (Admin only)
router.delete(
  "/delete-soft-product/:id",
  validObjectId,
  verifyAdmin,
  deleteSoftProduct,
);

// DELETE /api/products/delete-force-product/:id - Force delete product (Admin only)
router.delete(
  "/delete-force-product/:id",
  validObjectId,
  verifyAdmin,
  deleteForceProduct,
);

// GET /api/products/get-archived-products - Get all archived (soft-deleted) products (Admin only)
router.get("/get-archived-products", verifyAdmin, getArchivedProducts);

// PUT /api/products/restore-product/:id - Restore soft-deleted product (Admin only)
router.put("/restore-product/:id", validObjectId, verifyAdmin, restoreProduct);

// POST /api/products/filter-by-category - Filter products by category
router.post("/filter-by-category", filterProductsByCategory);

// GET /api/products/search - Search products by name or description
router.get("/search", searchProducts);

// GET /api/products/category/:categoryId - Get products by category
router.get("/category/:categoryId", getProductsByCategory);

// POST /api/products/filter-by-price - Filter products by price range
router.post("/filter-by-price", filterProductsByPrice);

module.exports = router;
