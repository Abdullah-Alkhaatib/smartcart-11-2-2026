import React, { useEffect, useMemo, useState } from "react";
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
  images: [], // array of {url, stock, color}
};

const ProductDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDetails, setImageDetails] = useState([]); // [{file, color, stock}]

  const token = localStorage.getItem("token");

  const headers = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const fetchProducts = async () => {
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
  };

  const fetchCategories = async () => {
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
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      toast.error("الحد الاقصى 10 صور");
    }
    const newFiles = files.slice(0, 10);
    setFormData((prev) => ({ ...prev, images: newFiles }));
    // إنشاء array للتفاصيل (color, stock) لكل صورة
    setImageDetails(newFiles.map(() => ({ stock: "0", color: "" })));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setImageDetails([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageDetailChange = (index, field, value) => {
    setImageDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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
    // التحقق من أن كل صورة لها ستوك صحيح
    if (formData.images.length > 0) {
      for (let i = 0; i < imageDetails.length; i++) {
        if (Number(imageDetails[i].stock) < 0) {
          toast.error(`الكمية في الصورة ${i + 1} يجب ان تكون 0 او اكثر`);
          return false;
        }
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

    // بناء بيانات الصور مع التفاصيل (stock, color)
    // عند التحديث: imageDetails يحتوي على الصور الموجودة + الجديدة
    // عند الإنشاء: imageDetails يحتوي على الصور الجديدة فقط
    const imagesMetadata = imageDetails.map((detail) => ({
      stock: String(detail.stock),
      color: detail.color,
    }));

    if (imagesMetadata.length > 0) {
      // إرسال ملفات الصور الجديدة فقط
      if (formData.images.length > 0) {
        formData.images.forEach((image) => payload.append("images", image));
      }
      // إرسال بيانات كل الصور (الموجودة + الجديدة) كـ JSON string
      payload.append("images", JSON.stringify(imagesMetadata));
    }

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
      images: [], // في التحديث، نرفع صور جديدة فقط
    });
    // معلومات الصور الموجودة حالياً
    setImageDetails(
      (product.images || []).map((img) => ({
        stock: String(img.stock || 0),
        color: img.color || "",
      })),
    );
    setShowForm(true);
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
      toast.error("تعذر حذف المنتج");
    }
  };

  const resolveImageUrl = (imageObj) => {
    // التعامل مع البنية الجديدة {url, stock, color}
    let url = imageObj?.url || imageObj || "";
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}/images/${url}`;
  };

  const resolveImages = (values = []) => {
    return values
      .map((value) => {
        const url = resolveImageUrl(value);
        return {
          url,
          stock: value?.stock || 0,
          color: value?.color || "",
        };
      })
      .filter((img) => img.url);
  };

  const getFinalPrice = (product) => {
    if (typeof product.finalPrice === "number") return product.finalPrice;
    if (!product.discount) return product.price;
    return product.price - (product.price * product.discount) / 100;
  };

  return (
    <section className="product-dashboard">
      <header className="product-dashboard__header">
        <div>
          <h2>
            <ShoppingBag size={22} />
            ادارة المنتجات
          </h2>
          <p>اضافة منتجات جديدة وتعديل او حذف المنتجات الحالية.</p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchProducts}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جار التحديث" : "تحديث"}
        </button>
      </header>

      <div className="product-dashboard__grid">
        {showForm && (
          <form
            className="product-form"
            onSubmit={editingId ? handleUpdate : handleCreate}
          >
            <h3>{editingId ? "تعديل المنتج" : "انشاء منتج جديد"}</h3>

            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="price">السعر</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  className="input-ltr"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="discount">الخصم (%)</label>
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  className="input-ltr"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            </div>

            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="images">الصور</label>
              {editingId && imageDetails.length > 0 && (
                <div className="existing-images">
                  <p className="label-existing">الصور الموجودة:</p>
                  <div className="existing-images-list">
                    {imageDetails.map((detail, index) => (
                      <div key={index} className="existing-image-item">
                        <div className="detail-fields">
                          <input
                            type="number"
                            placeholder="الكمية"
                            className="input-ltr"
                            value={
                              detail.stock !== undefined ? detail.stock : "0"
                            }
                            onChange={(e) =>
                              setImageDetails((prev) => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  stock: e.target.value,
                                };
                                return updated;
                              })
                            }
                            min="0"
                          />
                          <input
                            type="text"
                            dir="auto"
                            placeholder="اللون (مثال: أحمر)"
                            value={detail.color || ""}
                            onChange={(e) =>
                              setImageDetails((prev) => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  color: e.target.value,
                                };
                                return updated;
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="label-new">أضف صور جديدة:</p>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
              />
              {formData.images.length > 0 && (
                <div className="file-list">
                  <div>
                    {formData.images.map((file, index) => (
                      <div key={file.name} className="image-detail-form">
                        <span className="file-name">{file.name}</span>
                        <div className="detail-fields">
                          <input
                            type="number"
                            placeholder="الكمية"
                            className="input-ltr"
                            value={
                              imageDetails[index]?.stock !== undefined
                                ? imageDetails[index]?.stock
                                : "0"
                            }
                            onChange={(e) =>
                              handleImageDetailChange(
                                index,
                                "stock",
                                e.target.value,
                              )
                            }
                            min="0"
                          />
                          <input
                            type="text"
                            dir="auto"
                            placeholder="اللون"
                            value={imageDetails[index]?.color || ""}
                            onChange={(e) =>
                              handleImageDetailChange(
                                index,
                                "color",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="file-note">{formData.images.length}/10</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? "تحديث" : "انشاء"}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                الغاء
              </button>
            </div>
          </form>
        )}

        <div className="products-list">
          <div className="products-list__head">
            <h3>قائمة المنتجات</h3>
            <div className="header-actions">
              <span>{products.length} منتج</span>
              {!showForm && (
                <button
                  type="button"
                  className="btn-create"
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
            <div className="products-state">جار تحميل المنتجات...</div>
          ) : products.length === 0 ? (
            <div className="products-state">لا توجد منتجات حاليا</div>
          ) : (
            <div className="products-table">
              {products.map((product) => {
                const images = resolveImages(product.images || []);
                const coverImg = images[0];
                const finalPrice = getFinalPrice(product);
                const totalStock = product.totalStock || 0; // استخدام totalStock من الـ virtual field
                return (
                  <div className="product-card" key={product._id}>
                    <div className="product-media">
                      <img
                        src={
                          coverImg?.url ||
                          "https://via.placeholder.com/140x140?text=No+Image"
                        }
                        alt={product.name}
                        className="product-image"
                        onClick={() => setSelectedImage(coverImg?.url)}
                        style={{ cursor: "zoom-in" }}
                      />
                      {images.length > 1 && (
                        <div className="product-thumbs">
                          {images.slice(0, 4).map((image, index) => (
                            <img
                              key={`${product._id}-${index}`}
                              src={image.url}
                              alt={`${product.name}-${index + 1}`}
                              className="product-thumb"
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
                    <div className="product-info">
                      <div className="product-title">
                        <h4>{product.name}</h4>
                        {product.discount > 0 && (
                          <span className="discount-badge">
                            خصم {product.discount}%
                          </span>
                        )}
                      </div>
                      <p className="product-description">
                        {product.description}
                      </p>
                      <div className="product-variants">
                        {images.length > 0 && (
                          <div className="variants-list">
                            {images.map((img, idx) => (
                              <div key={idx} className="variant-item">
                                {img.color && (
                                  <span className="variant-label">
                                    <span>{img.color}</span>
                                  </span>
                                )}
                                <span className="variant-stock">
                                  {img.stock} وحدة
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="product-meta">
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
                        <span className="stock-tag">
                          الكمية الكلية: {totalStock}
                        </span>
                      </div>
                      <div className="product-category">
                        <Tags size={14} />
                        {product.category?.name || "بدون فئة"}
                      </div>
                    </div>
                    <div className="product-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => startEdit(product)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
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

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="enlarged" className="modal-image" />
        </div>
      )}
    </section>
  );
};

export default ProductDashboard;
