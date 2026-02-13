const {Product} = require("../model/ProductModel.js");
const {Category} = require("../model/CategoryModel.js");
const fs = require("fs");
const path = require("path");

// create product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, discount, category, stock } = req.body;

        if(!name || !description || price === undefined || !category) {
            return res.status(400).json({message: "All required fields must be provided"});
        }

        // check category
        const categoryExists = await Category.findById(category);
        if(!categoryExists) {
            return res.status(400).json({message: "Invalid category"});
        }

        // handel images
        // تخزين اسماء الصور (ممكن اكثر من صوره)
        const images = req.files ? req.files.map(file => file.filename) : []; // req.file لما بتكون صورة واحدة، req.files لما بتكون صور متعددة
        
        // create product
        const product = new Product({
            name,
            description,
            price,
            discount,
            category,
            stock,
            images
        });

        await product.save();

        res.status(201).json( product);

    } catch (error) {
        // لو حصل خطأ أثناء إنشاء المنتج، لازم نتأكد من حذف أي صور تم رفعها لتجنب تخزين صور غير مستخدمة على السيرفر
        if(req.files) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '..', 'public', 'images', file.filename);
                if(fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        res.status(500).json({message: error.message});

    }
};

// get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({isActive: true})
        .populate("category", "name") // populate category name only
        .sort({createdAt: -1}); // sort by newest first

        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// get single product
const getSingleProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findOne({_id: id, isActive: true})
        .populate("category", "name"); // populate category name only
        if(!product) {
            return res.status(404).json({message: "Product not found"});
        }

        res.status(200).json(product);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// update product
const updateProduct = async (req, res) => {
    const { id } = req.params;
    
    try {
        const { name, description, price, discount, category, stock } = req.body;

        // check product
        const product = await Product.findOne({_id: id, isActive: true});
        if(!product) {
            return res.status(404).json({message: "Product not found"});
        }

        // check category
        if(category) {
            const categoryExists = await Category.findById(category);
            if(!categoryExists) {
                return res.status(400).json({message: "Invalid category"});
            }
        }

        // حذف الصور القديمة من السيرفر لو تم تحديث الصور
        if(req.files && req.files.length > 0) {
            product.images.forEach((img) => {
                const oldPath = path.join(__dirname, '..', 'public', 'images', img); // __dirname => المسار الحالي للملف (productController.js), '..' => يطلع خطوه لفوق (backend), 'public/images' => يدخل على مجلد الصور, img => اسم الصورة
                if((fs.existsSync(oldPath))) { // التأكد أن الصورة موجودة قبل محاولة حذفها
                    fs.unlinkSync(oldPath); // حذف الصورة
                }
            });
            product.images = req.files.map(file => file.filename); // تحديث الصور الجديدة في المنتج
        };

        // تحديث باقي بيانات المنتج
        if(name) product.name = name;
        if(description) product.description = description;
        if(price !== undefined) product.price = price;
        if(discount !== undefined) product.discount = discount; // عشان لو الخصم 0، ما يتم تجاهله
        if(category) product.category = category;
        if(stock !== undefined) product.stock = stock;

        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// delete product (soft delete)
const deleteSoftProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findOne({_id: id, isActive: true});
        if(!product) {
            return res.status(404).json({message: "Product not found"});
        }

        product.isActive = false;
        await product.save();

        res.status(200).json({message: "Product deleted successfully"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// delete product (force delete)
const deleteForceProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if(!product) {
            return res.status(404).json({message: "Product not found"});
        }

        // حذف الصور من المجلد
        product.images.forEach((img) => {
            const imagePath = path.join(__dirname, '..', 'public', 'images', img);
            if(fs.existsSync(imagePath)) { // التأكد أن الصورة موجودة قبل محاولة حذفها
                fs.unlinkSync(imagePath); // حذف الصورة
            }
        });

        await Product.findByIdAndDelete(id);
        res.status(200).json({message: "Product permanently deleted"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteSoftProduct,
    deleteForceProduct
};