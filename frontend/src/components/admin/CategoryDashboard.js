import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./categoryDashboard.css";
import toast from "react-hot-toast";
import {
  Trash2,
  LayoutGrid,
  RefreshCw,
  Edit2,
  Eye,
  EyeOff,
} from "lucide-react";
import API_URL from "../../config/api";

const FALLBACK_IMAGE = "https://via.placeholder.com/150?text=No+Image";

export default function CategoryDashboard() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
  });

  const token = localStorage.getItem("token");

  const fetchCategories = useCallback(async () => {
    if (!token) {
      setLoading(false);
      toast.error("انتهت الجلسة، سجّل دخول كمسؤول مرة ثانية");
      return;
    }

    setRefreshing(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/categories/get-all-categories-admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر تحميل الفئات");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      image: event.target.files?.[0] || null,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", image: null });
    setShowForm(false);
  };

  const validateAuth = () => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return false;
    }
    return true;
  };

  const validateName = () => {
    if (!formData.name.trim()) {
      toast.error("الرجاء إدخال اسم الفئة");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const form = new FormData();
    form.append("name", formData.name.trim());
    form.append("description", formData.description || "");
    if (formData.image) {
      form.append("image", formData.image);
    }
    return form;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!validateAuth() || !validateName()) return;

    try {
      await axios.post(
        `${API_URL}/api/categories/create-category`,
        buildPayload(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("تم إنشاء الفئة بنجاح");
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر إنشاء الفئة");
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!validateAuth() || !validateName()) return;

    try {
      await axios.put(
        `${API_URL}/api/categories/update-category/${editingId}`,
        buildPayload(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("تم تحديث الفئة بنجاح");
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر تحديث الفئة");
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      image: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!validateAuth()) return;

    const confirmed = window.confirm("هل تريد حذف هذه الفئة؟");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/categories/delete-category/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("تم حذف الفئة");
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر حذف الفئة");
    }
  };

  const handleToggleStatus = async (id) => {
    if (!validateAuth()) return;

    try {
      const response = await axios.put(
        `${API_URL}/api/categories/toggle-category-status/${id}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === id ? { ...cat, isActive: response.data.isActive } : cat,
        ),
      );

      toast.success(
        response.data.isActive ? "تم تفعيل الفئة" : "تم إخفاء الفئة",
      );
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر تحديث حالة الفئة");
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

    if (!rawUrl) return "";

    const normalizedUrl = String(rawUrl).replace(/\\/g, "/").trim();

    if (
      normalizedUrl.startsWith("http://") ||
      normalizedUrl.startsWith("https://")
    ) {
      return normalizedUrl;
    }

    if (normalizedUrl.startsWith("/")) {
      return `${API_URL}${normalizedUrl}`;
    }

    if (normalizedUrl.startsWith("images/")) {
      return `${API_URL}/${normalizedUrl}`;
    }

    return `${API_URL}/images/${normalizedUrl}`;
  };

  return (
    <section className="category-dashboard">
      <header className="category-dashboard__header">
        <div>
          <h2>
            <LayoutGrid size={22} />
            إدارة الفئات
          </h2>
          <p>عرض الفئات، حذفها، وإنشاء فئات جديدة.</p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchCategories}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جارِ التحديث" : "تحديث"}
        </button>
      </header>

      <div className="category-dashboard__grid">
        {showForm && (
          <form
            className="category-form"
            onSubmit={editingId ? handleUpdate : handleCreate}
          >
            <h3>{editingId ? "تعديل الفئة" : "إنشاء فئة جديدة"}</h3>

            <div className="form-group">
              <label htmlFor="name">اسم الفئة</label>
              <input
                type="text"
                id="name"
                name="name"
                dir="auto"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="اسم الفئة"
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
                placeholder="وصف الفئة (اختياري)"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">الصورة</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
              />
              {formData.image && (
                <p className="file-name">{formData.image.name}</p>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? "تحديث" : "إنشاء"}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                إلغاء
              </button>
            </div>
          </form>
        )}

        <div className="categories-list">
          <div className="categories-list__head">
            <h3>قائمة الفئات</h3>
            <div className="header-actions">
              <span>{categories.length} فئة</span>
              {!showForm && (
                <button
                  type="button"
                  className="btn-create"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: "", description: "", image: null });
                    setShowForm(true);
                  }}
                >
                  + إنشاء فئة
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="state-box">جار تحميل الفئات...</div>
          ) : categories.length === 0 ? (
            <div className="state-box">لا توجد فئات حالياً</div>
          ) : (
            <div className="cdb-categories-table">
              {categories.map((category) => (
                <article className="cdb-category-card" key={category._id}>
                  <img
                    src={resolveImageUrl(category.image) || FALLBACK_IMAGE}
                    alt={category.name}
                    className="cdb-category-image"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />

                  <div className="cdb-category-info">
                    <div className="cdb-category-title">
                      <h4>{category.name}</h4>
                      <span
                        className={`cdb-category-status ${
                          category.isActive ? "is-active" : "is-hidden"
                        }`}
                      >
                        {category.isActive ? "نشطة" : "مخفية"}
                      </span>
                    </div>

                    {category.description && (
                      <p className="cdb-category-description">
                        {category.description}
                      </p>
                    )}

                    <p className="cdb-category-date">
                      {new Date(category.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>

                  <div className="cdb-category-actions">
                    <button
                      type="button"
                      className={`status-btn ${
                        category.isActive ? "is-active" : "is-hidden"
                      }`}
                      onClick={() => handleToggleStatus(category._id)}
                      title={category.isActive ? "إخفاء" : "تفعيل"}
                    >
                      {category.isActive ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>

                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => startEdit(category)}
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(category._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
