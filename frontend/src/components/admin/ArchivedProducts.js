import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Archive, RotateCcw, Trash2, Tags, RefreshCw } from "lucide-react";
import API_URL from "../../config/api";
import "./archivedProducts.css";

const ArchivedProducts = () => {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const token = localStorage.getItem("token");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const fetchArchivedProducts = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/products/get-archived-products`,
        { headers },
      );
      setArchivedProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل المنتجات المحذوفة");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      setLoading(false);
      return;
    }
    fetchArchivedProducts();
  }, [token, fetchArchivedProducts]);

  const resolveImageUrl = (imageObj) => {
    let url = imageObj?.url || imageObj || "";
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}/images/${url}`;
  };

  const resolveImages = (values = []) =>
    values
      .map((value) => ({
        url: resolveImageUrl(value),
        stock: value?.stock || 0,
        color: value?.color || "",
      }))
      .filter((img) => img.url);

  const getFinalPrice = (product) => {
    if (typeof product.finalPrice === "number") return product.finalPrice;
    if (!product.discount) return product.price;
    return product.price - (product.price * product.discount) / 100;
  };

  const handleRestore = async (id) => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

    const confirmed = window.confirm("هل تريد استرجاع هذا المنتج؟");
    if (!confirmed) return;

    try {
      await axios.put(
        `${API_URL}/api/products/restore-product/${id}`,
        {},
        { headers },
      );
      toast.success("تم استرجاع المنتج");
      setArchivedProducts((prev) =>
        prev.filter((product) => product._id !== id),
      );
    } catch (error) {
      console.error(error);
      toast.error("تعذر استرجاع المنتج");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

    const confirmed = window.confirm(
      "هل تريد حذف هذا المنتج نهائياً؟ (لا يمكن التراجع عن هذا الإجراء)",
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/products/delete-force-product/${id}`, {
        headers,
      });
      toast.success("تم حذف المنتج نهائياً");
      setArchivedProducts((prev) =>
        prev.filter((product) => product._id !== id),
      );
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف المنتج");
    }
  };

  return (
    <section className="archived-products">
      <header className="archived-header">
        <div>
          <h2>
            <Archive size={22} />
            المنتجات المحذوفة
          </h2>
          <p>استعرض واسترجع أو احذف نهائياً المنتجات المحذوفة.</p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchArchivedProducts}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جار التحديث" : "تحديث"}
        </button>
      </header>

      <div className="archived-container">
        {loading ? (
          <div className="archived-state">جار تحميل المنتجات المحذوفة...</div>
        ) : archivedProducts.length === 0 ? (
          <div className="archived-state">لا توجد منتجات محذوفة</div>
        ) : (
          <div className="archived-table">
            {archivedProducts.map((product) => {
              const images = resolveImages(product.images || []);
              const cover = images[0];
              const finalPrice = getFinalPrice(product);
              const totalStock = product.totalStock || 0;
              return (
                <div className="archived-card" key={product._id}>
                  <div className="archived-media">
                    <img
                      src={
                        cover?.url ||
                        "https://via.placeholder.com/140x140?text=No+Image"
                      }
                      alt={product.name}
                      className="archived-image"
                      onClick={() => setSelectedImage(cover?.url)}
                      style={{ cursor: "zoom-in" }}
                    />
                    {images.length > 1 && (
                      <div className="archived-thumbs">
                        {images.slice(0, 4).map((image, index) => (
                          <img
                            key={`${product._id}-${index}`}
                            src={image.url}
                            alt={`${product.name}-${index + 1}`}
                            className="archived-thumb"
                            onClick={() => setSelectedImage(image.url)}
                            style={{ cursor: "zoom-in" }}
                          />
                        ))}
                        {images.length > 4 && (
                          <span className="thumb-more">
                            +{images.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="archived-info">
                    <div className="archived-title">
                      <h4>{product.name}</h4>
                      {product.discount > 0 && (
                        <span className="discount-badge">
                          خصم {product.discount}%
                        </span>
                      )}
                    </div>
                    <p className="archived-description">
                      {product.description}
                    </p>
                    <div className="archived-meta">
                      <div className="price-container">
                        {product.discount > 0 && (
                          <span className="price-original input-ltr">
                            {Number(product.price).toFixed(2)} د.ك
                          </span>
                        )}
                        <span className="price-tag input-ltr">
                          {Number(finalPrice).toFixed(2)} د.ك
                        </span>
                      </div>
                      <span className="stock-tag">الكمية: {totalStock}</span>
                    </div>
                    <div className="archived-category">
                      <Tags size={14} />
                      {product.category?.name || "بدون فئة"}
                    </div>
                  </div>
                  <div className="archived-actions">
                    <button
                      type="button"
                      className="restore-btn"
                      onClick={() => handleRestore(product._id)}
                      title="استرجاع المنتج"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handlePermanentDelete(product._id)}
                      title="حذف نهائي"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedImage(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <img src={selectedImage} alt="enlarged" className="modal-image" />
          </div>
        </div>
      )}
    </section>
  );
};

export default ArchivedProducts;
