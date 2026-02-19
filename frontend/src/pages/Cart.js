import { useCart } from "../components/context/CartContext";
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
  const { cartItems, loading, removeFromCart, updateCartQuantity } = useCart();
  const navigate = useNavigate();

  // Debug: Log cart items to console
  console.log("Cart Items:", cartItems);

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
              console.log("Cart Item:", item);
              const product = item.product;
              console.log("Product:", product);
              if (!product) return null;

              // Find the image that matches the selected color
              const selectedImage = product.images?.find(
                (img) => img.color === item.color,
              );
              const imageUrl = selectedImage
                ? `${API_URL}/images/${selectedImage.url}`
                : product.images?.[0]
                  ? `${API_URL}/images/${product.images[0].url}`
                  : "/placeholder.png";

              const effectivePrice = getEffectivePrice(product);
              const itemTotal = effectivePrice * item.quantity;
              const categoryLabel =
                typeof product.category === "string"
                  ? product.category
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
                      <span className="cart-item-color">
                        <span
                          className="color-dot"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        {item.color}
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

            <button className="btn-checkout">
              <span>إتمام الشراء</span>
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
