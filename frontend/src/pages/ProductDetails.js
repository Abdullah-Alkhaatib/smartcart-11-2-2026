import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { ShoppingCart, ArrowRight, Package, Tag } from "lucide-react";
import { useCart } from "../components/context/CartContext";
import API_URL from "../config/api";
import "./productDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!product) return;

    document.title = `${product.name} | SmartCart`;

    const description = product.description
      ? product.description.slice(0, 155)
      : "تفاصيل المنتج وأسعاره وتوفيره على SmartCart.";

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", description);
  }, [product]);

  function resolveImageUrl(value) {
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
  }

  async function fetchProductDetails() {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/api/products/get-single-product/${id}`,
      );
      setProduct(data);
    } catch {
      toast.error("فشل تحميل تفاصيل المنتج");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  function handleColorSelect(index) {
    setSelectedImageIndex(index);
    setQuantity(1); // إعادة تعيين الكمية عند تغيير اللون
  }

  function handleAddToCart() {
    if (!product || !product.images[selectedImageIndex]) {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
      return;
    }

    const selectedImage = product.images[selectedImageIndex];

    if (selectedImage.stock < quantity) {
      toast.error("الكمية المطلوبة غير متوفرة");
      return;
    }

    // استدعاء addToCart بالـ parameters الصحيحة: productId, color, quantity
    addToCart(product._id, selectedImage.color, quantity);
  }

  function handleQuantityChange(action) {
    const selectedImage = product.images[selectedImageIndex];
    const maxStock = selectedImage.stock;

    if (action === "increase" && quantity < maxStock) {
      setQuantity(quantity + 1);
    } else if (action === "decrease" && quantity > 1) {
      setQuantity(quantity - 1);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>جارٍ تحميل التفاصيل...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state">
        <p>المنتج غير موجود</p>
      </div>
    );
  }

  const selectedImage = product.images[selectedImageIndex];
  const finalPrice =
    product.discount > 0
      ? (product.price - (product.price * product.discount) / 100).toFixed(2)
      : product.price;
  // product JSON-LD removed

  return (
    <div className="product-details-container">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowRight size={18} />
        <span>رجوع</span>
      </button>

      <div className="product-details-grid">
        {/* صورة المنتج */}
        <div className="product-images-section">
          <div className="main-image-wrapper">
            <img
              src={
                selectedImage?.url
                  ? resolveImageUrl(selectedImage.url)
                  : "https://via.placeholder.com/500?text=No+Image"
              }
              alt={product.name}
              className="main-product-image"
            />
            {product.discount > 0 && (
              <span className="discount-badge">-{product.discount}%</span>
            )}
          </div>

          {/* الألوان المتاحة */}
          {product.images.length > 1 && (
            <div className="color-selector">
              <h3 className="color-title">الألوان المتاحة:</h3>
              <div className="color-options">
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className={`color-option ${selectedImageIndex === index ? "active" : ""}`}
                    onClick={() => handleColorSelect(index)}
                  >
                    <img
                      src={resolveImageUrl(img.url)}
                      alt={img.color || `اللون ${index + 1}`}
                      className="color-thumbnail"
                    />
                    <span className="color-name">
                      {img.color || `اللون ${index + 1}`}
                    </span>
                    {img.stock === 0 && (
                      <span className="out-of-stock-overlay">نفذ</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* معلومات المنتج */}
        <div className="product-info-section">
          <h1 className="product-details-title">{product.name}</h1>

          <div className="product-meta">
            <div className="category-badge">
              <Tag size={16} />
              <span>{product.category?.name || "غير محدد"}</span>
            </div>
          </div>

          <p className="product-details-description">{product.description}</p>

          {/* السعر */}
          <div className="price-section">
            <div className="price-wrapper">
              <span className="final-price">{finalPrice} د.ك</span>
              {product.discount > 0 && (
                <span className="original-price">{product.price} د.ك</span>
              )}
            </div>
            {product.discount > 0 && (
              <div className="savings">
                توفير {(product.price - finalPrice).toFixed(2)} د.ك
              </div>
            )}
          </div>

          {/* الكمية المتاحة */}
          <div className="stock-section">
            <Package size={18} />
            <span>
              {selectedImage.stock > 0
                ? `متوفر: ${selectedImage.stock} قطعة`
                : "غير متوفر"}
            </span>
          </div>

          {/* اختيار الكمية */}
          {selectedImage.stock > 0 && (
            <div className="quantity-section">
              <label className="quantity-label">الكمية:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => handleQuantityChange("decrease")}
                  className="quantity-btn"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange("increase")}
                  className="quantity-btn"
                  disabled={quantity >= selectedImage.stock}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* زر الإضافة للسلة */}
          <button
            onClick={handleAddToCart}
            className="add-to-cart-details-btn"
            disabled={selectedImage.stock === 0}
          >
            <ShoppingCart size={20} />
            <span>
              {selectedImage.stock === 0 ? "غير متوفر" : "أضف إلى السلة"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
