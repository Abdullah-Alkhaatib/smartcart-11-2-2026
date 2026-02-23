import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight, Search, Eye, Package } from "lucide-react";
import { useCart } from "../components/context/CartContext";
import toast from "react-hot-toast";
import "./products.css";
import "./SearchResults.css";
import API_URL from "../config/api";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState({});

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
      const selected = product.images.find((img) => img.color === selectedColor);
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
              ? product.description.substring(0, 80)
              : "لا يوجد وصف متاح";
            const totalStock = getTotalStock(product);
            const selectedImage = getSelectedImage(product);
            const hasDiscount = product.discount > 0;

            return (
              <article key={`${product._id}-${index}`} className="product-card sr-card">
                {hasDiscount && (
                  <div className="product-badge discount-badge sr-badge">-{product.discount}%</div>
                )}
                {totalStock === 0 && (
                  <div className="product-badge out-of-stock-badge">غير متوفر</div>
                )}
                {totalStock > 0 && totalStock <= 5 && !hasDiscount && (
                  <div className="product-badge low-stock-badge">آخر {totalStock} قطع</div>
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
                          ? `${API_URL}/images/${selectedImage.url}`
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
                    {product.description?.length > 80 ? "..." : ""}
                  </p>

                  {product.images && product.images.length > 1 && (
                    <div className="product-colors sr-colors">
                      <span className="colors-label sr-colors-label">الألوان المتوفرة:</span>
                      <div className="colors-list sr-colors-dots">
                        {product.images.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className={`color-dot sr-color-thumb ${selectedImage?.color === img.color ? "active" : ""}`}
                            style={{
                              backgroundColor: img.color,
                              opacity: img.stock > 0 ? 1 : 0.3,
                            }}
                            title={img.color}
                            onClick={() => handleColorSelect(product._id, img.color)}
                          ></div>
                        ))}
                        {product.images.length > 4 && (
                          <span className="more-colors sr-more-colors">
                            +{product.images.length - 4}
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
                            {calculateFinalPrice(product.price, product.discount)} د.ك
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
                      <Eye size={16} />
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
