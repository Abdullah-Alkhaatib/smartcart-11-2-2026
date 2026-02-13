import React, { useState, useEffect } from "react";
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

  // Fetch all categories (admin)
  const fetchCategories = async () => {
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
      toast.error("تعذر تحميل الفئات");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  // Create new category
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("الرجاء إدخال اسم الفئة");
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    if (formData.image) {
      form.append("image", formData.image);
    }

    try {
      await axios.post(`${API_URL}/api/categories/create-category`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("تم إنشاء الفئة بنجاح");
      setFormData({ name: "", description: "", image: null });
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400) {
        toast.error("هذه الفئة موجودة بالفعل");
      } else {
        toast.error("تعذر إنشاء الفئة");
      }
    }
  };

  // Update category
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("الرجاء إدخال اسم الفئة");
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    if (formData.image) {
      form.append("image", formData.image);
    }

    try {
      await axios.put(
        `${API_URL}/api/categories/update-category/${editingId}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("تم تحديث الفئة بنجاح");
      setFormData({ name: "", description: "", image: null });
      setShowForm(false);
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحديث الفئة");
    }
  };

  // Start editing
  const startEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description,
      image: null,
    });
    setShowForm(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", image: null });
    setShowForm(false);
  };

  // Delete category
  const handleDelete = async (id) => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

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
      toast.error("تعذر حذف الفئة");
    }
  };

  // Toggle category status (active/hidden)
  const handleToggleStatus = async (id) => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

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
      toast.error("تعذر تحديث حالة الفئة");
    }
  };

  // Resolve image URL
  const resolveImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://"))
      return value;
    return `${API_URL}${value}`;
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
          {refreshing ? "جار التحديث" : "تحديث"}
        </button>
      </header>

      <div className="category-dashboard__grid">
        {/* Create/Edit Form */}
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
              <button type="button" className="btn-cancel" onClick={cancelEdit}>
                إلغاء
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
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
            <div className="categories-state">جار تحميل الفئات...</div>
          ) : categories.length === 0 ? (
            <div className="categories-state">لا توجد فئات حاليا</div>
          ) : (
            <div className="categories-table">
              {categories.map((category) => (
                <div className="category-card" key={category._id}>
                  <img
                    src={
                      resolveImageUrl(category.image) ||
                      "https://via.placeholder.com/150?text=No+Image"
                    }
                    alt={category.name}
                    className="category-image"
                  />
                  <div className="category-info">
                    <div className="category-title">
                      <h4>{category.name}</h4>
                      <span
                        className={`category-status ${
                          category.isActive ? "is-active" : "is-hidden"
                        }`}
                      >
                        {category.isActive ? "نشطة" : "مخفية"}
                      </span>
                    </div>
                    {category.description && (
                      <p className="category-description">
                        {category.description}
                      </p>
                    )}
                    <p className="category-date">
                      {new Date(category.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <div className="category-actions">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
