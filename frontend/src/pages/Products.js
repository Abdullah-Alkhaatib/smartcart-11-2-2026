import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./products.css";
import { useProductContext } from "../components/context/ProductContext";
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/context/CartContext";
import {
  Eye,
  ShoppingCart,
  DollarSign,
  Package,
  Filter,
  X,
  ChevronDown,
  Tag,
  Sparkles,
} from "lucide-react";
import API_URL from "../config/api";
import { getColorChipStyle } from "../utils/colorUtils";

export default function Products() {
  const PRODUCTS_PER_BATCH = 3;
  const LOW_STOCK_THRESHOLD = 3;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState({});
  const [checkedCategories, setCheckedCategories] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_BATCH);
  const [showFilters, setShowFilters] = useState(false);
  const { selectedCategory } = useProductContext();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const normalizeColorValue = (color) =>
    String(color || "")
      .trim()
      .toLowerCase();

  const resolveImageUrl = (value) => {
    const rawUrl =
      typeof value === "string"
        ? value
        : typeof value === "object"
          ? value?.url || value?.path || value?.filename || ""
          : "";

    if (!rawUrl || typeof rawUrl !== "string") return "";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    if (rawUrl.startsWith("/")) {
      return `${API_URL}${rawUrl}`;
    }
    return `${API_URL}/images/${rawUrl}`;
  };

  const getUniqueColorImages = (images = []) => {
    const uniqueByColor = new Map();

    images.forEach((image) => {
      const colorKey = normalizeColorValue(image?.color);
      if (!colorKey) return;

      const existingImage = uniqueByColor.get(colorKey);
      const existingStock = existingImage?.stock || 0;
      const currentStock = image?.stock || 0;

      if (!existingImage || (existingStock <= 0 && currentStock > 0)) {
        uniqueByColor.set(colorKey, image);
      }
    });

    return Array.from(uniqueByColor.values());
  };

  const getSelectedImage = (product) => {
    if (!product.images || product.images.length === 0) return null;

    const selectedColor = selectedColors[product._id];
    if (selectedColor) {
      const selectedColorKey = normalizeColorValue(selectedColor);

      const selectedInStock = product.images.find(
        (img) =>
          normalizeColorValue(img.color) === selectedColorKey && img.stock > 0,
      );
      if (selectedInStock) return selectedInStock;

      const selected = product.images.find(
        (img) => normalizeColorValue(img.color) === selectedColorKey,
      );
      if (selected) return selected;
    }

    const firstAvailableImage = product.images.find((img) => img.stock > 0);
    return firstAvailableImage || product.images[0];
  };

  const handleColorSelect = (productId, color) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: color,
    }));
  };

  // Get all categories
  const getCategories = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/categories/get-all-categories`,
      );
      setCategories(data);
    } catch {
      toast.error("فشل تحميل الفئات");
    }
  };

  // Get all products
  const getProducts = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/products/get-all-products`,
      );
      setProducts(data);
    } catch {
      toast.error("فشل تحميل المنتجات");
    }
  };

  // Filter by category
  const filterByCategory = async (selected) => {
    try {
      if (selected.length === 0) {
        getProducts();
        return;
      }

      const { data } = await axios.post(
        `${API_URL}/api/products/filter-by-category`,
        {
          categories: selected,
        },
      );
      setProducts(data);
    } catch {
      toast.error("فشل فلترة المنتجات");
    }
  };

  // Handle category checkbox
  const handleCategoryChange = (categoryId) => {
    let updated = [...checkedCategories];
    if (updated.includes(categoryId)) {
      updated = updated.filter((id) => id !== categoryId);
    } else {
      updated.push(categoryId);
    }
    setCheckedCategories(updated);
    filterByCategory(updated);
  };

  // Filter by price
  const handlePriceFilter = async (min, max, rangeName) => {
    try {
      setSelectedPriceRange(rangeName);
      const { data } = await axios.post(
        `${API_URL}/api/products/filter-by-price`,
        { min, max },
      );
      setProducts(data);
    } catch {
      toast.error("فشل فلترة المنتجات حسب السعر");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setCheckedCategories([]);
    setSelectedPriceRange(null);
    getProducts();
  };

  useEffect(() => {
    getCategories();
    getProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_BATCH);
  }, [products, PRODUCTS_PER_BATCH]);

  // React to selected category from Navbar
  useEffect(() => {
    if (selectedCategory) {
      setCheckedCategories([selectedCategory]);
      filterByCategory([selectedCategory]);
    } else {
      setCheckedCategories([]);
      getProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Handle add to cart
  const handleAddToCart = async (product) => {
    if (!product.images || product.images.length === 0) {
      toast.error("المنتج غير متوفر");
      return;
    }

    const selectedImage = getSelectedImage(product);

    if (!selectedImage || selectedImage.stock <= 0) {
      toast.error("المنتج غير متوفر بأي لون");
      return;
    }

    await addToCart(product._id, selectedImage.color, 1);
  };

  // Calculate total stock
  const getTotalStock = (product) => {
    if (!product.images || product.images.length === 0) return 0;
    return product.images.reduce((sum, img) => sum + (img.stock || 0), 0);
  };

  // Price ranges
  const priceRanges = [
    { label: "الكل", min: null, max: null, name: null },
    { label: "أقل من 50 د.ك", min: 0, max: 50, name: "0-50" },
    { label: "50 د.ك - 100 د.ك", min: 50, max: 100, name: "50-100" },
    { label: "100 د.ك - 500 د.ك", min: 100, max: 500, name: "100-500" },
    { label: "أكثر من 500 د.ك", min: 500, max: null, name: "500+" },
  ];

  return (
    <div className="products-page" dir="rtl">
      {/* Header */}
      <div className="products-header">
        <div className="products-header-content">
          <div className="header-title">
            <Sparkles className="header-icon" />
            <h1>جميع المنتجات</h1>
          </div>
          <p className="header-subtitle">
            اكتشف مجموعتنا الواسعة من المنتجات المميزة
          </p>

          {/* Mobile Filter Toggle */}
          <button
            className="mobile-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span>الفلاتر</span>
          </button>
        </div>
      </div>

      <div className="products-container">
        {/* Sidebar Filters */}
        <aside className={`filters-sidebar ${showFilters ? "show" : ""}`}>
          <div className="filters-header">
            <div className="filters-title">
              <Filter size={20} />
              <h3>تصفية المنتجات</h3>
            </div>
            <button
              className="close-filters"
              onClick={() => setShowFilters(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Clear Filters */}
          {(checkedCategories.length > 0 || selectedPriceRange) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <X size={16} />
              <span>مسح الفلاتر</span>
            </button>
          )}

          {/* Category Filter */}
          <div className="filter-section">
            <div className="filter-section-title">
              <Tag size={18} />
              <h4>الفئات</h4>
            </div>
            <div className="filter-options">
              {categories.map((cat) => (
                <label key={cat._id} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={checkedCategories.includes(cat._id)}
                    onChange={() => handleCategoryChange(cat._id)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-label">{cat.name}</span>
                  <span className="checkbox-count">
                    (
                    {products.filter((p) => p.category?._id === cat._id).length}
                    )
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-divider"></div>

          {/* Price Filter */}
          <div className="filter-section">
            <div className="filter-section-title">
              <DollarSign size={18} />
              <h4>نطاق السعر</h4>
            </div>
            <div className="filter-options">
              {priceRanges.map((range, index) => (
                <label key={index} className="filter-radio">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPriceRange === range.name}
                    onChange={() =>
                      handlePriceFilter(range.min, range.max, range.name)
                    }
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          {/* Products Count & Sort */}
          <div className="products-toolbar">
            <div className="products-count">
              <Package size={18} />
              <span>تم العثور على {products.length} منتج</span>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {products.length === 0 ? (
              <div className="no-products">
                <Package size={48} />
                <h3>لا توجد منتجات</h3>
                <p>جرب تغيير الفلاتر للعثور على منتجات أخرى</p>
              </div>
            ) : (
              products.slice(0, visibleCount).map((product) => {
                const totalStock = getTotalStock(product);
                const selectedImage = getSelectedImage(product);
                const uniqueColorImages = getUniqueColorImages(product.images);
                const finalPrice =
                  product.discount > 0
                    ? product.price - (product.price * product.discount) / 100
                    : product.price;
                const hasDiscount = product.discount > 0;

                return (
                  <div key={product._id} className="product-card">
                    {/* Product Badge */}
                    {hasDiscount && (
                      <div className="product-badge discount-badge">
                        -{product.discount}%
                      </div>
                    )}
                    {totalStock === 0 && (
                      <div className="product-badge out-of-stock-badge">
                        غير متوفر
                      </div>
                    )}
                    {totalStock > 0 &&
                      totalStock <= LOW_STOCK_THRESHOLD &&
                      !hasDiscount && (
                        <div className="product-badge low-stock-badge">
                          آخر {totalStock} قطع
                        </div>
                      )}

                    {/* Product Image */}
                    <div
                      className="product-image-wrapper"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={
                            selectedImage?.url
                              ? resolveImageUrl(selectedImage.url)
                              : "https://via.placeholder.com/300x220?text=No+Image"
                          }
                          alt={product.name}
                          className="product-image"
                        />
                      ) : (
                        <div className="no-image-placeholder">
                          <Package size={48} />
                          <span>لا توجد صورة</span>
                        </div>
                      )}

                      {/* Quick Actions Overlay */}
                      <div className="product-overlay">
                        <button
                          className="overlay-btn view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${product._id}`);
                          }}
                        >
                          {/* <Eye size={18} /> */}
                          <span>عرض التفاصيل</span>
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="product-info">
                      <div className="product-category">
                        {product.category?.name || "غير محدد"}
                      </div>
                      <h3 className="product-title">{product.name}</h3>
                      <p className="product-description">
                        {product.description?.substring(0, 80)}
                        {product.description?.length > 80 ? "..." : ""}
                      </p>

                      {/* Colors Available */}
                      {uniqueColorImages.length > 0 && (
                        <div className="product-colors">
                          <span className="colors-label">
                            الألوان المتوفرة:
                          </span>
                          <div className="colors-list">
                            {uniqueColorImages.slice(0, 4).map((img, index) => (
                              <button
                                key={`${normalizeColorValue(img.color)}-${index}`}
                                type="button"
                                className={`color-chip ${selectedImage?.color === img.color ? "active" : ""} ${img.stock > 0 ? "" : "out-of-stock"}`}
                                style={getColorChipStyle(img.color)}
                                aria-label={img.color || `اللون ${index + 1}`}
                                title={img.color || `اللون ${index + 1}`}
                                onClick={() =>
                                  handleColorSelect(product._id, img.color)
                                }
                              />
                            ))}
                            {uniqueColorImages.length > 4 && (
                              <span className="more-colors">
                                +{uniqueColorImages.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price & Actions */}
                      <div className="product-footer">
                        <div className="product-pricing">
                          {hasDiscount ? (
                            <>
                              <span className="current-price">
                                {finalPrice.toFixed(2)} د.ك
                              </span>
                              <span className="old-price">
                                {product.price.toFixed(2)} د.ك
                              </span>
                            </>
                          ) : (
                            <span className="current-price">
                              {product.price.toFixed(2)} د.ك
                            </span>
                          )}
                        </div>

                        <div className="product-actions">
                          <button
                            className="view-details-btn"
                            onClick={() => navigate(`/product/${product._id}`)}
                          >
                            {/* <Eye size={17} /> */}
                            <span>التفاصيل</span>
                          </button>

                          <button
                            className={`add-to-cart-btn ${!selectedImage || selectedImage.stock === 0 ? "disabled" : ""}`}
                            onClick={() => handleAddToCart(product)}
                            disabled={
                              !selectedImage || selectedImage.stock === 0
                            }
                          >
                            <ShoppingCart size={17} />
                            <span>
                              {!selectedImage || selectedImage.stock === 0
                                ? "غير متوفر"
                                : "أضف للسلة"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {products.length > visibleCount && (
            <div className="load-more-container">
              <button
                className="load-more-btn"
                onClick={() =>
                  setVisibleCount((prev) => prev + PRODUCTS_PER_BATCH)
                }
              >
                <ChevronDown size={20} />
                <span>تحميل المزيد</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
