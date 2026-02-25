import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { ShoppingCart, Star, TrendingUp, Zap } from "lucide-react";
import { useCart } from "../components/context/CartContext";
import { useProductContext } from "../components/context/ProductContext";
import API_URL from "../config/api";
import "./home.css";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const { addToCart } = useCart();
  const { setSelectedCategory } = useProductContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/products/get-all-products`,
      );
      setProducts(data);
    } catch (error) {
      console.log(error);
      toast.error("فشل تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/categories/get-all-categories`,
      );
      setCategories(data.slice(0, 6));
    } catch (error) {
      console.log(error);
    }
  }

  function handleAddToCart(product) {
    // اختيار أول لون متاح من المنتج
    const firstAvailableColor = product.images && product.images[0]?.color;

    if (!firstAvailableColor) {
      toast.error("لا توجد ألوان متاحة لهذا المنتج");
      return;
    }

    // استدعاء addToCart بالـ parameters الصحيحة: productId, color, quantity
    addToCart(product._id, firstAvailableColor, 1);
  }

  const displayedProducts = products.slice(0, visibleCount);
  const hasMoreProducts = products.length > visibleCount;

  // Handle category click
  function handleCategoryClick(categoryId) {
    setSelectedCategory(categoryId);
    navigate("/products");
  }

  function resolveCategoryImageUrl(value) {
    if (!value) return "";

    const rawUrl =
      typeof value === "string"
        ? value
        : typeof value === "object"
          ? value.url || value.path || value.filename || ""
          : "";

    if (!rawUrl || typeof rawUrl !== "string") return "";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    if (rawUrl.startsWith("/")) {
      return `${API_URL}${rawUrl}`;
    }
    return `${API_URL}/images/${rawUrl}`;
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={16} />
            <span>عروض حصرية</span>
          </div>
          <h1 className="hero-title">مرحبًا بك في متجري</h1>
          <p className="hero-description">
            اكتشف أفضل المنتجات بأسعار لا تُقاوم
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <TrendingUp size={18} />
              <span>{products.length}+ منتج</span>
            </div>
            <div className="stat-item">
              <Star size={18} />
              <span>جودة عالية</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="categories-section">
          <h2 className="section-title">تصفح حسب الفئة</h2>
          <div className="categories-grid">
            {categories.map((category) => {
              const categoryImage = resolveCategoryImageUrl(category.image);
              return (
                <div
                  key={category._id}
                  className="category-card"
                  onClick={() => handleCategoryClick(category._id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleCategoryClick(category._id)
                  }
                >
                  <div className="category-icon">
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={category.name}
                        className="category-icon-image"
                      />
                    ) : (
                      category.name.charAt(0)
                    )}
                  </div>
                  <h3 className="category-name">{category.name}</h3>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="products-section">
        <div className="section-header">
          <h2 className="section-title">المنتجات المميزة</h2>
          <p className="section-subtitle">اختر ما يناسبك من باقة منتجاتنا</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>جارِ تحميل المنتجات...</p>
          </div>
        ) : displayedProducts.length > 0 ? (
          <>
            <div className="products-grid">
              {displayedProducts.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image-wrapper">
                    <img
                      src={
                        product.images && product.images[0]?.url
                          ? `${API_URL}/images/${product.images[0].url}`
                          : "https://via.placeholder.com/300x220?text=No+Image"
                      }
                      alt={product.name}
                      className="product-image"
                    />
                    {product.discount > 0 && (
                      <span className="product-badge">-{product.discount}%</span>
                    )}
                  </div>

                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-description">
                      {product.description?.substring(0, 60)}
                    </p>

                    <div className="product-footer">
                      <div className="product-price">
                        <span className="current-price">
                          {product.discount > 0
                            ? (
                                product.price -
                                (product.price * product.discount) / 100
                              ).toFixed(2)
                            : product.price}{" "}
                          د.ك
                        </span>
                        {product.discount > 0 && (
                          <span className="old-price">{product.price} د.ك</span>
                        )}
                      </div>
                    </div>

                    <div className="product-actions">
                      <button
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="view-details-btn"
                        aria-label={`عرض تفاصيل ${product.name}`}
                      >
                        {/* <Eye size={16} /> */}
                        <span>التفاصيل</span>
                      </button>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="add-to-cart-btn"
                        aria-label={`إضافة ${product.name} إلى السلة`}
                      >
                        <ShoppingCart size={16} />
                        <span>أضف للسلة</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreProducts && (
              <div className="load-more-wrapper">
                <button
                  type="button"
                  className="load-more-btn"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>لا توجد منتجات متاحة حاليًا</p>
          </div>
        )}
      </section>
    </div>
  );
}
