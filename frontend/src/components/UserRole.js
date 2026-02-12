// Create global state to return user role
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import API_URL from "../config/api";

export const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchRole() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setRole(null);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRole(response.data?.user?.role ?? null);
      setLoading(false);
    } catch (error) {
      console.log(error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setRole(null);
      }

      toast.error("Session expired, please login again", {
        id: "auth-error", // 🔥 يمنع التكرار
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRole();
  }, []);

  const login = (newRole) => {
    setRole(newRole ?? null);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setRole(null);
    setLoading(false);
  };

  return (
    <UserRoleContext.Provider value={{ role, loading, login, logout }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
};
