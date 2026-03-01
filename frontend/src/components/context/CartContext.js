import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import API_URL from "../../config/api";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart items from the backend
  async function fetchCartItems() {
    const token = localStorage.getItem("token");
    if (!token) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/cart/get-my-cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCartItems(res.data?.items || []);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      toast.error("فشل تحميل عناصر سلة التسوق");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Add item to cart
  const addToCart = async (productId, color, quantity) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/cart/add-to-cart`,
        {
          productId,
          color,
          quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCartItems(res.data?.items || []);
      toast.success("تم إضافة العنصر إلى سلة التسوق");
      return res;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "فشل إضافة العنصر إلى سلة التسوق",
      );
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId, color) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.delete(`${API_URL}/api/cart/remove-cart-item`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId, color },
      });
      setCartItems(res.data?.items || []);
      toast.success("تم حذف العنصر من سلة التسوق");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "فشل حذف العنصر من سلة التسوق",
      );
    } finally {
      setLoading(false);
    }
  };

  // update item quantity
  const updateCartQuantity = async (productId, color, quantity) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }
    setLoading(true);

    try {
      const res = await axios.put(
        `${API_URL}/api/cart/update-cart-item`,
        { productId, color, quantity },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCartItems(res.data?.items || []);
      toast.success("تم تحديث كمية العنصر في سلة التسوق");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "فشل تحديث كمية العنصر في سلة التسوق",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        fetchCartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
