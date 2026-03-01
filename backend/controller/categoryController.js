const { Category } = require("../model/CategoryModel.js");
const {
  uploadImageBuffer,
  deleteImageByUrl,
} = require("../utils/cloudinaryImage");

// create category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists (only check active categories)
    const existingCategory = await Category.findOne({ name, isActive: true });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    let image;
    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file, {
        folder: "smartcart/categories",
      });
      image = uploaded.url;
    }

    const category = new Category({
      name,
      description: description || "",
      ...(image && { image }), // Add image only if provided
    }); 

    await category.save();

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create category" });
  }
};

// get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({createdAt: -1,});
    res.status(200).json(categories);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get categories" });
  }
};

// get single category
const getSingleCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findOne({ _id: id, isActive: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get category" });
  }
};

// update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findOne({ _id: id, isActive: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if name is unique (if being updated)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name, isActive: true });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: "Category name already in use" });
      }
    }

    // Update basic data
    category.name = name || category.name;
    category.description =description !== undefined ? description : category.description;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    // If new image is provided
    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file, {
        folder: "smartcart/categories",
      });

      if (category.image) {
        await deleteImageByUrl(category.image).catch((error) => {
          if (error) {
            console.error("Failed to delete old category image:", error);
          }
        });
      }

      category.image = uploaded.url;
    }

    await category.save();

    res.status(200).json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update category" });
  }
};

// delete category (soft delete by setting isActive to false)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id, isActive: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Soft delete: set isActive to false
    category.isActive = false;
    await category.save();

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

// force delete category (hard delete)
// const forceDeleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const category = await Category.findByIdAndDelete(id);
//     if (!category) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     // Delete image from file system if it exists
//     if (category.image && category.image.startsWith("/images/")) {
//       const imagePath = path.join(__dirname, "..", "public", category.image);
//       fs.unlink(imagePath, (error) => {
//         if (error) {
//           console.error("Failed to delete category image:", error);
//         }
//       });
//     }

//     res.status(200).json({ message: "Category permanently deleted" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to force delete category" });
//   }
// };


const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to get categories" });
  }
};

const toggleCategoryStatus = async (req, res) => { 
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isActive = !category.isActive;

    await category.save();

    res.status(200).json({
      message: "Category status updated",
      isActive: category.isActive,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to update category" });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
//   forceDeleteCategory,
  getAllCategoriesAdmin,
  toggleCategoryStatus,
};
