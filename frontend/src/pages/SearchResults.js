import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight, Search, Eye } from "lucide-react";
import { useCart } from "../components/context/CartContext";
import toast from "react-hot-toast";
import "./SearchResults.css";
import API_URL from "../config/api";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleAddToCart = async (product) => {
    if (!product.images || product.images.length === 0) {
      toast.error("المنتج لا يحتوي على صور");
      return;
    }

    const firstImage = product.images[0];
    const selectedColor = firstImage.color || "default";

    try {
      await addToCart(product._id, selectedColor, 1);
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
        <div className="sr-grid">
          {searchResults.map((product, index) => {
            const shortDescription = product.description
              ? product.description.substring(0, 100)
              : "لا يوجد وصف متاح";

            return (
              <article key={`${product._id}-${index}`} className="sr-card">
                {product.discount > 0 && (
                  <span className="sr-badge">-{product.discount}%</span>
                )}

                <div
                  className="sr-image-wrap"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      className="sr-image"
                      src={`${API_URL}/images/${product.images[0].url}`}
                      alt={product.name}
                    />
                  ) : (
                    <div className="sr-no-image">لا توجد صورة</div>
                  )}
                </div>

                <div className="sr-info">
                  <h3
                    className="sr-product-title"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.name}
                  </h3>
                  <p className="sr-description">{shortDescription}</p>

                  {product.category && (
                    <div className="sr-category">
                      <span className="sr-category-badge">
                        {product.category.name}
                      </span>
                    </div>
                  )}

                  {product.images && product.images.length > 1 && (
                    <div className="sr-colors">
                      <span className="sr-colors-label">الألوان:</span>
                      <div className="sr-colors-dots">
                        {product.images.slice(0, 5).map((img, idx) => (
                          <div
                            key={idx}
                            className="sr-color-thumb"
                            style={{
                              backgroundImage: `url(${API_URL}/images/${img.url})`,
                            }}
                            title={img.color}
                          ></div>
                        ))}
                        {product.images.length > 5 && (
                          <span className="sr-more-colors">
                            +{product.images.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="sr-footer">
                    <div className="sr-price-block">
                      <span className="sr-price-new">
                        {product.discount > 0
                          ? `${calculateFinalPrice(product.price, product.discount)} د.ك`
                          : `${product.price} د.ك`}
                      </span>
                      {product.discount > 0 && (
                        <span className="sr-price-old">
                          {product.price} د.ك
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
                      className="sr-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart size={16} />
                      <span>أضف للسلة</span>
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
