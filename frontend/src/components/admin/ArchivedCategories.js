import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Archive, RotateCcw, Trash2, RefreshCw, LayoutGrid } from "lucide-react";
import API_URL from "../../config/api";
import "./archivedCategories.css";

const FALLBACK_IMAGE = "https://via.placeholder.com/140x140?text=No+Image";

const ArchivedCategories = () => {
  const [archivedCategories, setArchivedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const fetchArchivedCategories = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/categories/get-archived-categories`,
        { headers },
      );
      setArchivedCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الفئات المحذوفة");
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

    fetchArchivedCategories();
  }, [token, fetchArchivedCategories]);

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

  const handleRestore = async (id) => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

    const confirmed = window.confirm("هل تريد استرجاع هذه الفئة؟");
    if (!confirmed) return;

    try {
      await axios.put(`${API_URL}/api/categories/restore-category/${id}`, {}, { headers });
      toast.success("تم استرجاع الفئة");
      setArchivedCategories((prev) => prev.filter((category) => category._id !== id));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر استرجاع الفئة");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول كمسؤول");
      return;
    }

    const confirmed = window.confirm(
      "هل تريد حذف هذه الفئة نهائياً؟ (لا يمكن التراجع عن هذا الإجراء)",
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/categories/delete-force-category/${id}`, {
        headers,
      });
      toast.success("تم حذف الفئة نهائياً");
      setArchivedCategories((prev) => prev.filter((category) => category._id !== id));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "تعذر حذف الفئة");
    }
  };

  return (
    <section className="archived-categories">
      <header className="archived-categories__header">
        <div>
          <h2>
            <Archive size={22} />
            الفئات المحذوفة
          </h2>
          <p>استعرض واسترجع أو احذف نهائياً الفئات المحذوفة.</p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchArchivedCategories}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جارِ التحديث" : "تحديث"}
        </button>
      </header>

      <div className="archived-categories__content">
        {loading ? (
          <div className="state-box">جار تحميل الفئات المحذوفة...</div>
        ) : archivedCategories.length === 0 ? (
          <div className="state-box">لا توجد فئات محذوفة</div>
        ) : (
          <div className="archived-categories__grid">
            {archivedCategories.map((category) => (
              <article className="archived-category-card" key={category._id}>
                <img
                  src={resolveImageUrl(category.image) || FALLBACK_IMAGE}
                  alt={category.name}
                  className="archived-category-image"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />

                <div className="archived-category-info">
                  <div className="archived-category-title">
                    <h4>{category.name}</h4>
                    <span className="status-badge">محذوفة</span>
                  </div>

                  {category.description ? (
                    <p className="archived-category-description">{category.description}</p>
                  ) : (
                    <p className="archived-category-description empty">بدون وصف</p>
                  )}

                  <div className="archived-category-meta">
                    <span>
                      <LayoutGrid size={14} />
                      {new Date(category.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>

                <div className="archived-category-actions">
                  <button
                    type="button"
                    className="restore-btn"
                    onClick={() => handleRestore(category._id)}
                    title="استرجاع الفئة"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handlePermanentDelete(category._id)}
                    title="حذف نهائي"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ArchivedCategories;
