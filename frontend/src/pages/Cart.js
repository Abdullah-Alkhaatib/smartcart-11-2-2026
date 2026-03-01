import { useCart } from "../components/context/CartContext";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./cart.css";
import API_URL from "../config/api";

export default function Cart() {
  const {
    cartItems,
    loading,
    removeFromCart,
    updateCartQuantity,
    fetchCartItems,
  } = useCart();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

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

  // Format price with KD currency
  const formatPrice = (price) => {
    return `${price.toFixed(2)} د.ك`;
  };

  // Get effective product price (finalPrice if available, otherwise apply discount)
  const getEffectivePrice = (product) => {
    if (!product) return 0;

    const finalPrice = Number(product.finalPrice);
    if (Number.isFinite(finalPrice) && finalPrice >= 0) {
      return finalPrice;
    }

    const basePrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;

    if (discount > 0) {
      return basePrice - (basePrice * discount) / 100;
    }

    return basePrice;
  };

  // Calculate total price
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + getEffectivePrice(item.product) * item.quantity;
    }, 0);
  };

  // Calculate total items
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handle quantity change
  const handleQuantityChange = async (productId, color, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartQuantity(productId, color, newQuantity);
  };

  // Handle remove item
  const handleRemove = async (productId, color) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج من السلة؟")) {
      await removeFromCart(productId, color);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("يرجى تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    const fullName = window.prompt("الاسم الكامل للمستلم:", "");
    if (!fullName || !fullName.trim()) return;

    const phone = window.prompt("رقم الهاتف:", "");
    if (!phone || !phone.trim()) return;
    const normalizedPhone = phone.trim();
    if (!/^\d+$/.test(normalizedPhone)) {
      toast.error("رقم الهاتف يجب أن يحتوي أرقام فقط");
      return;
    }

    const city = window.prompt("المدينة:", "");
    if (!city || !city.trim()) return;

    const address = window.prompt("العنوان التفصيلي:", "");
    if (!address || !address.trim()) return;

    try {
      setCheckoutLoading(true);

      await axios.post(
        `${API_URL}/api/orders/create-order`,
        {
          shippingAddress: {
            fullName: fullName.trim(),
            phone: normalizedPhone,
            city: city.trim(),
            address: address.trim(),
          },
          paymentMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchCartItems();
      toast.success("تم إنشاء الطلب بنجاح");
    } catch (error) {
      toast.error(error.response?.data?.message || "فشل إنشاء الطلب");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="loading-spinner-cart"></div>
        <p>جاري تحميل السلة...</p>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-cart-content">
          <div className="empty-cart-icon">
            <ShoppingCart size={120} />
          </div>
          <h2>سلة التسوق فارغة</h2>
          <p>لم تقم بإضافة أي منتجات إلى سلة التسوق بعد</p>
          <button
            onClick={() => navigate("/products")}
            className="btn-shop-now"
          >
            <Package size={20} />
            تصفح المنتجات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-header-content">
          <div className="cart-header-icon">
            <ShoppingCart size={48} />
          </div>
          <div>
            <h1>سلة التسوق</h1>
            <p>لديك {totalItems} منتج في السلة</p>
          </div>
        </div>
      </div>

      <div className="cart-container">
        {/* Cart Items */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h2>المنتجات ({cartItems.length})</h2>
          </div>

          <div className="cart-items-list">
            {cartItems.map((item, index) => {
              const product = item.product;
              if (!product) return null;

              // Find the image that matches the selected color
              const selectedImage = product.images?.find(
                (img) => img.color === item.color,
              );
              const imageUrl = selectedImage
                ? resolveImageUrl(selectedImage.url)
                : product.images?.[0]
                  ? resolveImageUrl(product.images[0].url)
                  : "/placeholder.png";

              const effectivePrice = getEffectivePrice(product);
              const itemTotal = effectivePrice * item.quantity;
              const colorLabel = String(item.color || "غير محدد").trim();
              const categoryLabel =
                typeof product.category === "string"
                  ? isMongoObjectId(product.category)
                    ? ""
                    : product.category
                  : product.category?.name;

              return (
                <div
                  key={`${product._id}-${item.color}-${index}`}
                  className="cart-item"
                >
                  {/* Product Image */}
                  <div className="cart-item-image">
                    <img src={imageUrl} alt={product.name} />
                    {product.discount > 0 && (
                      <span className="cart-item-badge">
                        -{product.discount}%
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="cart-item-info">
                    <h3
                      className="cart-item-title"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="cart-item-description">
                      {product.description?.substring(0, 100)}
                    </p>
                    <div className="cart-item-meta">
                      <span
                        className="cart-item-color"
                        title={`اللون: ${colorLabel}`}
                        aria-label={`اللون: ${colorLabel}`}
                      >
                        اللون: {colorLabel}
                      </span>
                      {categoryLabel && (
                        <span className="cart-item-category">
                          {categoryLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="cart-item-quantity">
                    <label>الكمية</label>
                    <div className="quantity-controls">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            product._id,
                            item.color,
                            item.quantity - 1,
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="quantity-btn"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            product._id,
                            item.color,
                            item.quantity + 1,
                          )
                        }
                        className="quantity-btn"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="cart-item-price">
                    <div className="price-label">السعر</div>
                    <div className="price-value">
                      {formatPrice(effectivePrice)}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="cart-item-total">
                    <div className="total-label">المجموع</div>
                    <div className="total-value">{formatPrice(itemTotal)}</div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(product._id, item.color)}
                    className="cart-item-remove"
                    title="حذف من السلة"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="cart-summary-section">
          <div className="cart-summary">
            <h2>ملخص الطلب</h2>

            <div className="summary-row">
              <span>المجموع الفرعي</span>
              <span>{formatPrice(calculateTotal())}</span>
            </div>

            <div className="summary-row">
              <span>الشحن</span>
              <span className="shipping-free">مجاني</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>المجموع الإجمالي</span>
              <span>{formatPrice(calculateTotal())}</span>
            </div>

            <div className="payment-method-section">
              <label className="payment-method-label">طريقة الدفع</label>
              <div className="payment-method-options">
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === "COD" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  الدفع عند الاستلام
                </button>

                <button
                  type="button"
                  className={`payment-option ${paymentMethod === "Card" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("Card")}
                >
                  بطاقة
                </button>
              </div>
            </div>

            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              <span>
                {checkoutLoading ? "جارٍ إنشاء الطلب..." : "إتمام الشراء"}
              </span>
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => navigate("/products")}
              className="btn-continue-shopping"
            >
              متابعة التسوق
            </button>

            <div className="summary-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>شحن مجاني</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>إرجاع خلال 30 يوم</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>دفع آمن</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
