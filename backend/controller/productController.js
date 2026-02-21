const { Product } = require("../model/ProductModel.js");
const { Category } = require("../model/CategoryModel.js");
const fs = require("fs");
const path = require("path");

const getActiveCategoryIds = async () => {
  const activeCategories = await Category.find({ isActive: true }).select("_id");
  return activeCategories.map((categoryDoc) => categoryDoc._id);
};

// create product
const createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, category } = req.body;
    const imagesData = req.body.images ? JSON.parse(req.body.images) : []; // بيانات الصور من الفورم (url, stock, color, size)

    if (!name || !description || price === undefined || !category) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // check category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // handel images - كل صورة تحتوي على url و stock و color
    const images = imagesData.map((imgData, index) => ({
      url:
        req.files && req.files[index] ? req.files[index].filename : imgData.url,
      stock: parseInt(imgData.stock) || 0,
      color: imgData.color || "",
    }));

    // create product - لا نحتاج stock منفصل، الستوك موجود في كل صورة
    const product = new Product({
      name,
      description,
      price,
      discount,
      category,
      images,
    });

    await product.save();

    res.status(201).json(product);
  } catch (error) {
    // لو حصل خطأ أثناء إنشاء المنتج، لازم نتأكد من حذف أي صور تم رفعها لتجنب تخزين صور غير مستخدمة على السيرفر
    if (req.files) {
      req.files.forEach((file) => {
        const filePath = path.join(
          __dirname,
          "..",
          "public",
          "images",
          file.filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    console.error(error);

    res.status(500).json({ message: error.message });
  }
};

// get all products
const getAllProducts = async (req, res) => {
  try {
    const activeCategoryIds = await getActiveCategoryIds();

    const products = await Product.find({
      isActive: true,
      category: { $in: activeCategoryIds },
    })
      .populate("category", "name") // populate category name only
      .sort({ createdAt: -1 }); // sort by newest first

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get single product
const getSingleProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const activeCategoryIds = await getActiveCategoryIds();

    const product = await Product.findOne({
      _id: id,
      isActive: true,
      category: { $in: activeCategoryIds },
    }).populate("category", "name"); // populate category name only
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update product
const updateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const { name, description, price, discount, category } = req.body;
    const imagesData = req.body.images ? JSON.parse(req.body.images) : null;

    // check product
    const product = await Product.findOne({ _id: id, isActive: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // check category
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category" });
      }
    }

    // إذا كانت هناك صور جديدة فقط، احذف القديمة وضيف الجديدة
    if (req.files && req.files.length > 0) {
      // حذف الصور القديمة من الديسك فقط إذا رفعنا صور جديدة
      product.images.forEach((img) => {
        const oldPath = path.join(
          __dirname,
          "..",
          "public",
          "images",
          img.url || img,
        ); // التعامل مع الهيكل القديم والجديد
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      });
      // الصور الجديدة = الملفات الجديدة + معلومات الصور الموجودة (بدون الملفات القديمة)
      const newImagesData = imagesData
        ? imagesData.slice(product.images.length)
        : [];
      product.images = req.files.map((file, index) => ({
        url: file.filename,
        stock: newImagesData[index]
          ? parseInt(newImagesData[index].stock) || 0
          : 0,
        color: newImagesData[index] ? newImagesData[index].color || "" : "",
      }));
    } else if (imagesData && Array.isArray(imagesData)) {
      // إذا كانت بيانات صور فقط بدون ملفات جديدة، حدّث بيانات الصور الموجودة فقط
      product.images = product.images.map((img, index) => ({
        url: img.url || img,
        stock: imagesData[index]
          ? parseInt(imagesData[index].stock) || 0
          : img.stock || 0,
        color: imagesData[index]
          ? imagesData[index].color || ""
          : img.color || "",
      }));
    }

    // تحديث باقي بيانات المنتج
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (discount !== undefined) product.discount = discount;
    if (category) product.category = category;

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete product (soft delete)
const deleteSoftProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findOne({ _id: id, isActive: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete product (force delete)
const deleteForceProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // حذف الصور من المجلد - التعامل مع الهيكل الجديد
    product.images.forEach((img) => {
      const imagePath = path.join(__dirname, "..", "public", "images", img.url); // img.url بدل img
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getArchivedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: false })
      .populate("category", "name") // populate category name only
      .sort({ createdAt: -1 }); // sort by newest first

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const restoreProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findOne({ _id: id, isActive: false });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = true;
    await product.save();

    res.status(200).json({ message: "Product restored successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//filter products by category - هتستخدم لما المستخدم يختار كاتيجوري من الصفحة عشان يشوف المنتجات اللي فيها
const filterProductsByCategory = async(req, res) => {
    try {
        const {categories} = req.body; // مصفوفة من الاي ديز
        const activeCategoryIds = await getActiveCategoryIds();
        const activeCategoryIdsSet = new Set(
          activeCategoryIds.map((categoryId) => String(categoryId)),
        );

        if(!categories || categories.length === 0){ // لو مفيش تصنيفات مختارة، رجع كل المنتجات
            const allProducts = await Product.find({
              isActive: true,
              category: { $in: activeCategoryIds },
            })
            .populate('category', 'name')
            .sort({ createdAt: -1 });
            return res.status(200).json(allProducts);
        }

        const visibleSelectedCategories = categories.filter((categoryId) =>
          activeCategoryIdsSet.has(String(categoryId)),
        );

        if (visibleSelectedCategories.length === 0) {
          return res.status(200).json([]);
        }

        const filteredProducts = await Product.find({
            isActive: true,
            category: { $in: visibleSelectedCategories } // جلب المنتجات اللي كاتيجوري بتاعها في المصفوفة
        }).populate('category', 'name') // عرض اسم الكاتيجوري بدل الاي دي نبعها
        .sort({ createdAt: -1 });
        res.status(200).json(filteredProducts);

    } catch (error) {
        res.status(500).json({ message: 'Error filtering products', error: error.message });
    }
};


// filter by search
const searchProducts = async (req, res) => {
    try {
        const { query } = req.query; // query => نص البحث 
    const activeCategoryIds = await getActiveCategoryIds();

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const regex = new RegExp(query, 'i'); // 'i' => عشان البحث مايكونش حساس لحالة الاحرف (كبيرة او صغيرة)

        const products = await Product.find({
          isActive: true,
          category: { $in: activeCategoryIds },
            $or: [ // $or => واحد من الشروط دي لازم يتحقق
                { name: { $regex: regex } }, // البحث في الاسم
            ]
        }).populate('category', 'name')
        .sort({ createdAt: -1 });

        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({ message: 'Error searching products', error: error.message });
    }
};

// get products by category
const getProductsByCategory = async (req, res) => { // عشان لما المستخدم يضغط على كاتيجوري من الصفحة، يشوف المنتجات نبعه
    try {
        const { categoryId } = req.params; // categoryId

        const categoryDoc = await Category.findOne({
          _id: categoryId,
          isActive: true,
        }).select("_id");

        if (!categoryDoc) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const products = await Product.find({
          category: categoryId,
          isActive: true,
        }).populate('category', 'name');

        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'No products found for this category' });
        }

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products by category', error: error.message });
    }
};

// get products by price
const filterProductsByPrice = async (req, res) => {
    try {
        const {min, max} = req.body; 
        const activeCategoryIds = await getActiveCategoryIds();

        const query = {
          isActive: true,
          category: { $in: activeCategoryIds },
        }; // يعني لو مفيش شروط، يرجع كل المنتجات النشطة في فئات نشطة

        if(min !== undefined && min !== null) query.price = {$gte: min}; // $gte => أكبر من أو يساوي
        if(max !== undefined && max !== null) query.price = {...query.price, $lte: max}; // ...query.price => لو في شرط سابق (زي شرط المين)، نحافظ عليه، $lte => أقل من أو يساوي

        const products = await Product.find(query) // query => الشروط اللي حددناها
        .populate('category', 'name')
        .sort({ createdAt: -1 }); // ترتيب من الارخص للاغلى

        res.status(200).json(products);
        
    } catch (error) {
        res.status(500).json({ message: 'Error filtering products by price', error: error.message });
    }
};

module.exports = {
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
};
