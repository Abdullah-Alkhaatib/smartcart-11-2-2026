import "../admin/dashboardUsers.css";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Trash2, Users, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import CreateUsers from "./CreateUsers";
import API_URL from "../../config/api";

const DashboardUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/api/users/get-all-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل المستخدمين");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    if (!token) return;

    const confirmed = window.confirm("هل تريد حذف هذا المستخدم؟");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/users/delete-user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("تم حذف المستخدم");
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف المستخدم");
    }
  };

  const resolveImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://"))
      return value;
    return `${API_URL}${value}`;
  };

  return (
    <section className="dashboard-users">
      <header className="dashboard-users__header">
        <div>
          <h2>
            <Users size={22} />
            ادارة المستخدمين
          </h2>
          <p>عرض المستخدمين، حذفهم، وانشاء حسابات جديدة للادارة.</p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchUsers}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جار التحديث" : "تحديث"}
        </button>
      </header>

      <div className="dashboard-users__grid">
        <CreateUsers onCreated={fetchUsers} />

        <div className="users-list">
          <div className="users-list__head">
            <h3>قائمة المستخدمين</h3>
            <span>{users.length} مستخدم</span>
          </div>

          {loading ? (
            <div className="users-state">جار تحميل المستخدمين...</div>
          ) : users.length === 0 ? (
            <div className="users-state">لا يوجد مستخدمين حاليا</div>
          ) : (
            <div className="users-table">
              {users.map((user) => (
                <div className="user-row" key={user._id}>
                  <div className="user-meta">
                    <img
                      src={
                        resolveImageUrl(user.profilePicture) ||
                        "https://static.vecteezy.com/system/resources/previews/036/280/650/non_2x/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg"
                      }
                      alt={user.username}
                    />
                    <div>
                      <h4>{user.username}</h4>
                      <p className="input-ltr">{user.email}</p>
                    </div>
                  </div>

                  <div className="user-info">
                    <span>{user.role === "admin" ? "مدير" : "مستخدم"}</span>
                    <span className="input-ltr">
                      {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(user._id)}
                  >
                    <Trash2 size={18} />
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardUsers;
