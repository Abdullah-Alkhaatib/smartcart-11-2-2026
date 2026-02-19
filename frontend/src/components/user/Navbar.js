import "./navbar.css";
import { ShoppingCart, Search, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useProductContext } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import API_URL from "../../config/api";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const { selectedCategory, setSelectedCategory } = useProductContext();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  // Fetch user profile on component mount
  async function fetchUserProfile() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        return;
      }

      const { data } = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(data);
    } catch (error) {
      console.log(
        "Error loading user profile:",
        error.response?.data || error.message,
      );
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // get all categories for the dropdown
  async function fetchCategories() {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/categories/get-all-categories`,
      );
      setCategories(data);
    } catch (error) {
      console.log(error);
      toast.error("فشل تحميل الأقسام");
    }
  }

  useEffect(() => {
    fetchUserProfile();
    fetchCategories();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/login");
  }

  function handleCategorySelect(event) {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    navigate("/products");
  }

  async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.trim();

    if (!query) {
    //   toast.error("يرجى إدخال كلمة للبحث");
      return;
    }

    try {
      const { data } = await axios.get(
        `${API_URL}/api/products/search?query=${encodeURIComponent(query)}`,
      );

      console.log("Navbar - Search results:", data);
      console.log("Navbar - Query:", query);

      // التوجه إلى صفحة نتائج البحث مع النتائج
      navigate("/search-results", {
        state: {
          results: data,
          query: query,
        },
      });
      
      setSearchInput("");
    } catch (error) {
      console.log("Navbar - Search error:", error);
      toast.error("فشل تحميل نتائج البحث");
    }
  }

  const userImageSrc = user?.profilePicture?.startsWith("/images/")
    ? `${API_URL}${user.profilePicture}`
    : user?.profilePicture;

  return (
    <nav className="navbar" dir="rtl">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          <ShoppingCart size={20} />
          <span>متجري</span>
        </Link>
      </div>

      <div className="navbar-center">
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="ابحث عن المنتجات..."
            className="search-input"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="search-btn">
            بحث
          </button>
        </form>
      </div>

      <div className="navbar-links">
        <Link
          to="/"
          className="nav-link"
          onClick={() => setSelectedCategory("")}
        >
          الرئيسية
        </Link>

        <Link
          to="/products"
          className="nav-link"
          onClick={() => setSelectedCategory("")}
        >
          المنتجات
        </Link>

        <select
          className="nav-select"
          value={selectedCategory}
          onChange={handleCategorySelect}
        >
          <option value="">كل الأقسام</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="navbar-right">
        <Link to="/cart" className="navbar-cart" aria-label="فتح السلة">
          <ShoppingCart size={20} />
          <span className="cart-count">{cartCount}</span>
        </Link>

        {loading ? (
          <div className="navbar-loading">جارٍ التحميل...</div>
        ) : user ? (
          <div className="navbar-user">
            {userImageSrc ? (
              <img
                src={userImageSrc}
                alt="الصورة الشخصية"
                className="navbar-user-image"
                onClick={() => navigate("/profile")}
              />
            ) : (
              <button
                type="button"
                className="navbar-user-fallback"
                onClick={() => navigate("/profile")}
                aria-label="فتح الملف الشخصي"
              >
                <User size={16} />
              </button>
            )}

            <span className="navbar-user-name">{user.username}</span>

            <button onClick={handleLogout} className="navbar-logout-button">
              تسجيل الخروج
            </button>
          </div>
        ) : (
          <div className="navbar-auth">
            <Link to="/login" className="navbar-login-button">
              تسجيل الدخول
            </Link>
            <Link to="/register" className="navbar-register-button">
              إنشاء حساب
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
