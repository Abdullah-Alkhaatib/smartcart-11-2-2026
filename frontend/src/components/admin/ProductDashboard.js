import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  RefreshCw,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Tags,
} from "lucide-react";
import API_URL from "../../config/api";
import "./productDashboard.css";

const initialForm = {
  name: "",
  description: "",
  price: "",
  discount: "0",
  category: "",
  images: [],
};

const ProductDashboard = () => {
  const rootRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [imageDetails, setImageDetails] = useState([]);
  const [existingImagesCount, setExistingImagesCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  const token = localStorage.getItem("token");

  const headers = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const fetchProducts = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/products/get-all-products`,
        {
          headers,
        },
      );
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل المنتجات");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [headers]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/categories/get-all-categories-admin`,
        {
          headers,
        },
      );
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الفئات");
    }
  }, [token, headers]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      toast.error("الحد الاقصى 10 صور");
    }
    const limitedFiles = files.slice(0, 10);
    setFormData((prev) => ({ ...prev, images: limitedFiles }));

    setImageDetails((prev) => {
      const existingPart = editingId ? prev.slice(0, existingImagesCount) : [];
      const newPart = limitedFiles.map((_, index) => {
        const currentDetail = prev[existingImagesCount + index] || {};
        return {
          stock: currentDetail.stock !== undefined ? currentDetail.stock : "0",
          color: currentDetail.color || "",
        };
      });
      return [...existingPart, ...newPart];
    });
  };

  const resetForm = () => {
    setFormData(initialForm);
    setImageDetails([]);
    setExistingImagesCount(0);
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageDetailChange = (index, field, value) => {
    setImageDetails((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...(updated[index] || {}),
        [field]: value,
      };
      return updated;
    });
  };

  const validateForm = () => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("الرجاء إدخال اسم المنتج");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("الرجاء إدخال وصف المنتج");
      return false;
    }
    if (!formData.price || Number(formData.price) < 0) {
      toast.error("الرجاء إدخال سعر صحيح");
      return false;
    }
    if (!formData.category) {
      toast.error("الرجاء اختيار الفئة");
      return false;
    }
    if (Number(formData.discount) < 0 || Number(formData.discount) > 100) {
      toast.error("الخصم يجب ان يكون بين 0 و 100");
      return false;
    }
    for (const detail of imageDetails) {
      if (Number(detail?.stock || 0) < 0) {
        toast.error("الكمية لكل لون يجب ان تكون 0 او اكثر");
        return false;
      }
    }
    return true;
  };

  const buildFormData = () => {
    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("description", formData.description.trim());
    payload.append("price", String(formData.price));
    payload.append("discount", String(formData.discount));
    payload.append("category", formData.category);

    if (formData.images.length > 0) {
      formData.images.forEach((image) => payload.append("images", image));
    }

    const existingMetadata = imageDetails
      .slice(0, existingImagesCount)
      .map((detail) => ({
        stock: String(detail?.stock ?? 0),
        color: detail?.color || "",
      }));

    const newImagesMetadata = formData.images.map((_, index) => {
      const detail = imageDetails[existingImagesCount + index] || {};
      return {
        stock: String(detail.stock ?? 0),
        color: detail.color || "",
      };
    });

    const metadata = editingId
      ? [...existingMetadata, ...newImagesMetadata]
      : newImagesMetadata;

    payload.append("images", JSON.stringify(metadata));

    return payload;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = buildFormData();
      await axios.post(`${API_URL}/api/products/create-product`, payload, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("تم إنشاء المنتج بنجاح");
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("تعذر إنشاء المنتج");
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = buildFormData();
      await axios.put(
        `${API_URL}/api/products/update-product/${editingId}`,
        payload,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("تم تحديث المنتج بنجاح");
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحديث المنتج");
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      discount: product.discount ?? 0,
      category: product.category?._id || "",
      images: [],
    });

    const existingDetails = (product.images || []).map((image) => ({
      stock: String(image?.stock ?? 0),
      color: image?.color || "",
    }));

    setImageDetails(existingDetails);
    setExistingImagesCount(existingDetails.length);
    setShowForm(true);

    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const handleDelete = async (id) => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

    const confirmed = window.confirm("هل تريد حذف هذا المنتج؟");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/products/delete-soft-product/${id}`, {
        headers,
      });
      toast.success("تم حذف المنتج");
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر حذف المنتج");
    }
  };

  const resolveImageUrl = (value) => {
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
  };

  const resolveImages = (values = []) =>
    values.map((value) => resolveImageUrl(value)).filter(Boolean);

  const getFinalPrice = (product) => {
    if (typeof product.finalPrice === "number") return product.finalPrice;
    if (!product.discount) return product.price;
    return product.price - (product.price * product.discount) / 100;
  };

  const openImagePreview = (imageUrl) => {
    if (!imageUrl) return;
    setSelectedImage(imageUrl);
  };

  return (
    <section className="pdb-root" ref={rootRef}>
      <header className="pdb-header">
        <div>
          <h2>
            <ShoppingBag size={22} />
            ادارة المنتجات
          </h2>
          <p>اضافة منتجات جديدة وتعديل او حذف المنتجات الحالية.</p>
        </div>
        <button
          type="button"
          className="pdb-refresh-btn"
          onClick={fetchProducts}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جار التحديث" : "تحديث"}
        </button>
      </header>

      <div className="pdb-grid">
        {showForm && (
          <form
            className="pdb-form"
            onSubmit={editingId ? handleUpdate : handleCreate}
          >
            <h3>{editingId ? "تعديل المنتج" : "انشاء منتج جديد"}</h3>

            <div className="pdb-form-group">
              <label htmlFor="name">اسم المنتج</label>
              <input
                type="text"
                id="name"
                name="name"
                dir="auto"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="اسم المنتج"
                required
              />
            </div>

            <div className="pdb-form-group">
              <label htmlFor="description">الوصف</label>
              <textarea
                id="description"
                name="description"
                dir="auto"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="وصف المنتج"
                rows="4"
                required
              />
            </div>

            <div className="pdb-form-grid">
              <div className="pdb-form-group">
                <label htmlFor="price">السعر</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  className="pdb-input-ltr"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="pdb-form-group">
                <label htmlFor="discount">الخصم (%)</label>
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  className="pdb-input-ltr"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            </div>

            <div className="pdb-form-group">
              <label htmlFor="category">الفئة</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">اختر فئة</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pdb-form-group">
              <label htmlFor="images">الصور</label>

              {editingId && existingImagesCount > 0 && (
                <div className="pdb-file-list">
                  {imageDetails
                    .slice(0, existingImagesCount)
                    .map((detail, index) => (
                      <div key={`existing-${index}`} className="pdb-form-grid">
                        <input
                          type="number"
                          placeholder="كمية اللون"
                          className="pdb-input-ltr"
                          value={detail?.stock ?? "0"}
                          onChange={(event) =>
                            handleImageDetailChange(
                              index,
                              "stock",
                              event.target.value,
                            )
                          }
                          min="0"
                        />
                        <input
                          type="text"
                          dir="auto"
                          placeholder="اللون"
                          value={detail?.color || ""}
                          onChange={(event) =>
                            handleImageDetailChange(
                              index,
                              "color",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    ))}
                </div>
              )}

              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
              />

              {formData.images.length > 0 && (
                <div className="pdb-file-list">
                  {formData.images.map((file, index) => {
                    const detailIndex = existingImagesCount + index;
                    return (
                      <div
                        key={`${file.name}-${index}`}
                        className="pdb-form-grid"
                      >
                        <span>{file.name}</span>
                        <input
                          type="number"
                          placeholder="كمية اللون"
                          className="pdb-input-ltr"
                          value={imageDetails[detailIndex]?.stock ?? "0"}
                          onChange={(event) =>
                            handleImageDetailChange(
                              detailIndex,
                              "stock",
                              event.target.value,
                            )
                          }
                          min="0"
                        />
                        <input
                          type="text"
                          dir="auto"
                          placeholder="اللون"
                          value={imageDetails[detailIndex]?.color || ""}
                          onChange={(event) =>
                            handleImageDetailChange(
                              detailIndex,
                              "color",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    );
                  })}
                  <span className="pdb-file-note">
                    {formData.images.length}/10
                  </span>
                </div>
              )}
            </div>

            <div className="pdb-form-actions">
              <button type="submit" className="pdb-btn-submit">
                {editingId ? "تحديث" : "انشاء"}
              </button>
              <button
                type="button"
                className="pdb-btn-cancel"
                onClick={resetForm}
              >
                الغاء
              </button>
            </div>
          </form>
        )}

        <div className="pdb-list">
          <div className="pdb-list-head">
            <h3>قائمة المنتجات</h3>
            <div className="pdb-header-actions">
              <span>{products.length} منتج</span>
              {!showForm && (
                <button
                  type="button"
                  className="pdb-btn-create"
                  onClick={() => {
                    setEditingId(null);
                    setFormData(initialForm);
                    setShowForm(true);
                  }}
                >
                  <Plus size={16} />
                  انشاء منتج
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="pdb-state">جار تحميل المنتجات...</div>
          ) : products.length === 0 ? (
            <div className="pdb-state">لا توجد منتجات حاليا</div>
          ) : (
            <div className="pdb-table">
              {products.map((product) => {
                const images = resolveImages(product.images || []);
                const cover = images[0];
                const finalPrice = getFinalPrice(product);
                return (
                  <div className="pdb-card" key={product._id}>
                    <div className="pdb-media">
                      <img
                        src={
                          cover ||
                          "https://via.placeholder.com/140x140?text=No+Image"
                        }
                        alt={product.name}
                        className="pdb-image"
                        onClick={() => openImagePreview(cover)}
                      />
                      {images.length > 1 && (
                        <div className="pdb-thumbs">
                          {images.slice(0, 4).map((image, index) => (
                            <img
                              key={`${product._id}-${index}`}
                              src={image}
                              alt={`${product.name}-${index + 1}`}
                              className="pdb-thumb"
                              onClick={() => openImagePreview(image)}
                            />
                          ))}
                          {images.length > 4 && (
                            <span className="pdb-thumb-more">
                              +{images.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="pdb-info">
                      <div className="pdb-title">
                        <h4>{product.name}</h4>
                        {product.discount > 0 && (
                          <span className="pdb-discount-badge">
                            خصم {product.discount}%
                          </span>
                        )}
                      </div>
                      <p className="pdb-description">{product.description}</p>
                      <div className="pdb-meta">
                        <span className="pdb-price-tag pdb-input-ltr">
                          {Number(finalPrice).toFixed(2)} د.ك
                        </span>
                        <span className="pdb-stock-tag">
                          الكمية: {product.totalStock ?? 0}
                        </span>
                      </div>
                      <div className="pdb-category">
                        <Tags size={14} />
                        {product.category?.name || "بدون فئة"}
                      </div>
                    </div>
                    <div className="pdb-actions">
                      <button
                        type="button"
                        className="pdb-edit-btn"
                        onClick={() => startEdit(product)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="pdb-delete-btn"
                        onClick={() => handleDelete(product._id)}
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
      </div>

      {selectedImage && (
        <div className="pdb-image-modal" onClick={() => setSelectedImage(null)}>
          <button
            type="button"
            className="pdb-image-modal-close"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="product-preview"
            className="pdb-image-modal-content"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default ProductDashboard;
