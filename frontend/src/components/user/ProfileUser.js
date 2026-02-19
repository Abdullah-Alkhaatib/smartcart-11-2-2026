import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Camera,
  Calendar,
  Shield,
  Trash2,
  Save,
} from "lucide-react";
import "./profileUser.css";
import API_URL from "../../config/api";

export default function ProfileUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const { data } = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(data);
      setUsername(data.username || "");
      setEmail(data.email || "");
    } catch (err) {
      console.error(err);
      toast.error("فشل تحميل الملف الشخصي");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("غير مصرح");
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      if (file) formData.append("profilePicture", file);

      await axios.put(
        `${API_URL}/api/users/update-user/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("تم تحديث الملف الشخصي بنجاح");

      // Reset file inputs
      setFile(null);
      setPreviewImage(null);

      // Refresh user data without page reload
      await fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error("فشل التحديث");
    }
  };

  // Delete account
  const handleDelete = async () => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.",
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      await axios.delete(`${API_URL}/api/users/delete-user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.removeItem("token");
      toast.success("تم حذف الحساب بنجاح");
      navigate("/register");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error("غير مسموح لك بحذف هذا الحساب");
      } else if (err.response?.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
      } else {
        toast.error(err.response?.data?.message || "فشل الحذف");
      }
    }
  };

  // update password
  async function handlePasswordUpdate(e) {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("غير مصرح");
        navigate("/login");
        return;
      }

      await axios.put(
        `${API_URL}/api/users/password`,
        {
          currentPassword: currentPassword,
          newPassword: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("تم تحديث كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "فشل تحديث كلمة المرور");
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner-profile"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="profile-user-page">
      {/* Page Header */}
      <div className="profile-page-header">
        <div className="profile-header-content">
          <Shield className="profile-header-icon" size={40} />
          <div>
            <h1>الملف الشخصي</h1>
            <p>إدارة معلوماتك الشخصية وإعدادات الحساب</p>
          </div>
        </div>
      </div>

      <div className="profile-container">
        {/* Profile Info Card */}
        <div className="profile-card profile-main-card">
          <div className="profile-card-header">
            <User size={24} />
            <h2>المعلومات الشخصية</h2>
          </div>

          <div className="profile-content">
            {/* Profile Image Section */}
            <div className="profile-image-section">
              <div className="profile-image-wrapper">
                <div className="profile-image-container">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="preview"
                      className="profile-preview"
                    />
                  ) : user && user.profilePicture ? (
                    <img
                      src={
                        user.profilePicture.startsWith("/images/")
                          ? `${API_URL}${user.profilePicture}`
                          : user.profilePicture
                      }
                      alt="profile"
                      className="profile-preview"
                    />
                  ) : (
                    <div className="profile-placeholder">
                      <User size={60} />
                    </div>
                  )}
                  <label htmlFor="file-upload" className="profile-upload-btn">
                    <Camera size={20} />
                    <span>تغيير الصورة</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
                {/* <p className="profile-image-hint">PNG, JPG حتى 10MB</p> */}
              </div>
            </div>

            {/* Profile Form */}
            <form className="profile-form" onSubmit={handleUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <User size={18} />
                    <span>اسم المستخدم</span>
                  </label>
                  <input
                    type="text"
                    dir="auto"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={18} />
                    <span>البريد الإلكتروني</span>
                  </label>
                  <input
                    type="email"
                    dir="auto"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني"
                    required
                  />
                </div>
              </div>

              {user?.createdAt && (
                <div className="profile-meta">
                  <Calendar size={18} />
                  <span>
                    <strong>تاريخ الانضمام:</strong>{" "}
                    {new Date(user.createdAt).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}

              <div className="profile-actions">
                <button type="submit" className="btn btn-primary">
                  <Save size={18} />
                  <span>حفظ التغييرات</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  <Trash2 size={18} />
                  <span>حذف الحساب</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password Update Card */}
        <div className="profile-card profile-password-card">
          <div className="profile-card-header">
            <Lock size={24} />
            <h2>تغيير كلمة المرور</h2>
          </div>

          <div className="profile-content">
            <form className="password-form" onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label>
                  <Lock size={18} />
                  <span>كلمة المرور الحالية</span>
                </label>
                <input
                  type="password"
                  placeholder="أدخل كلمة المرور الحالية"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} />
                  <span>كلمة المرور الجديدة</span>
                </label>
                <input
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                <Shield size={18} />
                <span>تحديث كلمة المرور</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
