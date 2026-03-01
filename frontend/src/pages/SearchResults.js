import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight, Search, Eye, Package } from "lucide-react";
import { useCart } from "../components/context/CartContext";
import toast from "react-hot-toast";
import "./products.css";
import "./SearchResults.css";
import API_URL from "../config/api";
import { getColorChipStyle } from "../utils/colorUtils";

export default function SearchResults() {
  const PRODUCT_DESCRIPTION_LIMIT = 80;
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState({});

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

  const truncateDescription = (text, limit) => {
    if (!text) return "";
    if (text.length <= limit) return text;
    return `${text.substring(0, limit)}...`;
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

  useEffect(() => {
    if (location.state?.results) {
      setSearchResults(location.state.results);
      setSearchQuery(location.state.query || "");
    }
  }, [location.state]);

  // Calculate final price after discount
  const calculateFinalPrice = (price, discount) => {
    if (discount > 0) {
      return (price - (price * discount) / 100).toFixed(2);
    }
    return price.toFixed(2);
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

  const getTotalStock = (product) => {
    if (!product.images || product.images.length === 0) return 0;
    return product.images.reduce((sum, image) => sum + (image.stock || 0), 0);
  };

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

    try {
      await addToCart(product._id, selectedImage.color, 1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="sr-empty" dir="rtl">
        <div className="sr-empty-card">
          <div className="sr-empty-icon">
            <Search size={80} />
          </div>
          <h2>لا توجد نتائج بحث</h2>
          <p className="sr-empty-text">
            {searchQuery
              ? `لم نجد أي نتائج لـ "${searchQuery}"`
              : "قم بالبحث عن المنتجات التي تريدها"}
          </p>
          <button
            className="sr-empty-button"
            onClick={() => navigate("/products")}
          >
            تصفح جميع المنتجات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-page" dir="rtl">
      <header className="sr-header">
        <div className="sr-header-content">
          <button className="sr-back-btn" onClick={() => navigate(-1)}>
            <ArrowRight size={20} />
            رجوع
          </button>
          <div className="sr-title-row">
            {/* <Search className="sr-title-icon" size={28} /> */}
            {/* <h1 className="sr-title">نتائج البحث</h1> */}
          </div>
          {/* <p className="sr-subtitle">
            عثرنا على {searchResults.length} منتج
            {searchQuery && ` لـ "${searchQuery}"`}
          </p> */}
        </div>
      </header>

      <main className="sr-container">
        <div className="products-grid sr-grid">
          {searchResults.map((product, index) => {
            const shortDescription = product.description
              ? truncateDescription(product.description, PRODUCT_DESCRIPTION_LIMIT)
              : "لا يوجد وصف متاح";
            const totalStock = getTotalStock(product);
            const selectedImage = getSelectedImage(product);
            const uniqueColorImages = getUniqueColorImages(product.images);
            const hasDiscount = product.discount > 0;

            return (
              <article
                key={`${product._id}-${index}`}
                className="product-card sr-card"
              >
                {hasDiscount && (
                  <div className="product-badge discount-badge sr-badge">
                    -{product.discount}%
                  </div>
                )}
                {totalStock === 0 && (
                  <div className="product-badge out-of-stock-badge">
                    غير متوفر
                  </div>
                )}
                {totalStock > 0 && totalStock <= 5 && !hasDiscount && (
                  <div className="product-badge low-stock-badge">
                    آخر {totalStock} قطع
                  </div>
                )}

                <div
                  className="product-image-wrapper sr-image-wrap"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      className="product-image sr-image"
                      src={
                        selectedImage?.url
                          ? resolveImageUrl(selectedImage.url)
                          : "https://via.placeholder.com/300x220?text=No+Image"
                      }
                      alt={product.name}
                    />
                  ) : (
                    <div className="no-image-placeholder sr-no-image">
                      <Package size={48} />
                      <span>لا توجد صورة</span>
                    </div>
                  )}

                  <div className="product-overlay">
                    <button
                      className="overlay-btn view-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/product/${product._id}`);
                      }}
                    >
                      <Eye size={18} />
                      <span>عرض التفاصيل</span>
                    </button>
                  </div>
                </div>

                <div className="product-info sr-info">
                  <div className="product-category sr-category">
                    {product.category?.name || "غير محدد"}
                  </div>
                  <h3
                    className="product-title sr-product-title"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.name}
                  </h3>
                  <p className="product-description sr-description">
                    {shortDescription}
                  </p>

                  {uniqueColorImages.length > 0 && (
                    <div className="product-colors sr-colors">
                      <span className="colors-label sr-colors-label">
                        الألوان المتوفرة:
                      </span>
                      <div className="colors-list sr-colors-dots">
                        {uniqueColorImages.slice(0, 4).map((img, idx) => (
                          <button
                            key={`${normalizeColorValue(img.color)}-${idx}`}
                            type="button"
                            className={`color-chip sr-color-chip ${normalizeColorValue(selectedImage?.color) === normalizeColorValue(img.color) ? "active" : ""} ${img.stock > 0 ? "" : "out-of-stock"}`}
                            style={getColorChipStyle(img.color)}
                            aria-label={img.color || `اللون ${idx + 1}`}
                            title={img.color || `اللون ${idx + 1}`}
                            onClick={() =>
                              handleColorSelect(product._id, img.color)
                            }
                          />
                        ))}
                        {uniqueColorImages.length > 4 && (
                          <span className="more-colors sr-more-colors">
                            +{uniqueColorImages.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="product-footer sr-footer">
                    <div className="product-pricing sr-price-block">
                      {hasDiscount ? (
                        <>
                          <span className="current-price sr-price-new">
                            {calculateFinalPrice(
                              product.price,
                              product.discount,
                            )}{" "}
                            د.ك
                          </span>
                          <span className="old-price sr-price-old">
                            {product.price.toFixed(2)} د.ك
                          </span>
                        </>
                      ) : (
                        <span className="current-price sr-price-new">
                          {product.price.toFixed(2)} د.ك
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sr-actions">
                    <button
                      className="sr-details-btn"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      {/* <Eye size={16} /> */}
                      <span>التفاصيل</span>
                    </button>

                    <button
                      className={`add-to-cart-btn sr-cart-btn ${!selectedImage || selectedImage.stock === 0 ? "disabled" : ""}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={!selectedImage || selectedImage.stock === 0}
                    >
                      <ShoppingCart size={18} />
                      <span>
                        {!selectedImage || selectedImage.stock === 0
                          ? "غير متوفر"
                          : "أضف للسلة"}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
