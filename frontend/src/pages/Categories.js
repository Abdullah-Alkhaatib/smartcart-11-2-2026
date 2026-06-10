import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Grid3X3, Layers, ArrowLeft } from "lucide-react";
import "./categories.css";
import API_URL from "../config/api";
import { useProductContext } from "../components/context/ProductContext";
import JsonLd from "../components/JsonLd";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setSelectedCategory } = useProductContext();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(
        `${API_URL}/api/categories/get-all-categories`,
      );

      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError("تعذر تحميل الفئات، حاول مرة أخرى.");
      toast.error("فشل تحميل الفئات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resolveImage = (category) => {
    if (!category?.image) {
      return "";
    }

    if (category.image.startsWith("/images/")) {
      return `${API_URL}${category.image}`;
    }

    return category.image;
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate("/products");
    window.scrollTo(0, 0);
  };

  const categoriesSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "فئات SmartCart",
    url: `${window.location.origin}/categories`,
    description: "استكشف فئات SmartCart لتصل إلى المنتج المناسب بسرعة وسهولة.",
  };

  const categoriesListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "فئات SmartCart",
    itemListElement: categories.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category.name,
    })),
  };

  return (
    <section className="categories-page" dir="rtl">
      <JsonLd id="categories-collection-schema" data={categoriesSchema} />
      <JsonLd id="categories-list-schema" data={categoriesListSchema} />
      <div className="categories-header">
        <div className="categories-header__title">
          <Layers size={24} />
          <h1>الفئات</h1>
        </div>
        <p>اختر الفئة المناسبة لتصفح المنتجات بشكل أسرع وأسهل.</p>
      </div>

      {loading ? (
        <div className="categories-state categories-state--loading">
          <Grid3X3 size={20} />
          <span>جاري تحميل الفئات...</span>
        </div>
      ) : error ? (
        <div className="categories-state categories-state--error">
          <span>{error}</span>
          <button type="button" onClick={fetchCategories}>
            إعادة المحاولة
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="categories-state">
          <span>لا توجد فئات متاحة حالياً.</span>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => {
            const imageSrc = resolveImage(category);

            return (
              <article key={category._id} className="category-card">
                <div className="category-card__media">
                  {imageSrc ? (
                    <img src={imageSrc} alt={category.name} loading="lazy" />
                  ) : (
                    <div className="category-card__fallback">
                      {(category.name || "?").charAt(0)}
                    </div>
                  )}
                </div>

                <div className="category-card__content">
                  <h3>{category.name}</h3>
                  <p>{category.description || "تصفح منتجات هذه الفئة الآن."}</p>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(category._id)}
                  >
                    <span>عرض المنتجات</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
