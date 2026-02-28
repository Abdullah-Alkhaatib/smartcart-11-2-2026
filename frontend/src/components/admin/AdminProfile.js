import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import "../admin/adminProfile.css";
import API_URL from "../../config/api";

const AdminProfile = () => {
  const [profile, setProfile] = useState(null); // لتخزين بيانات الملف الشخصي
  const [form, setForm] = useState({
    username: "",
    email: "",
  });
  const [imageFile, setImageFile] = useState(null); // لتخزين الملف المختار قبل الرفع
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!token) {
      setLoading(false);
      setError("يرجى تسجيل الدخول مرة اخرى.");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(response.data);
      setForm({
        username: response.data?.username || "",
        email: response.data?.email || "",
      });
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل بيانات الحساب.");
      toast.error("فشل تحميل الملف الشخصي");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (event) => {
    // لتحديث حالة النموذج عند تغيير الحقول
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value })); // تحديث الحقل المحدد في النموذج
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]; // الحصول على الملف المختار من input type file
    if (!file) return;
    setImageFile(file); // لتحديث حالة الصورة المختارة
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!profile?._id) return; // تأكد من وجود بيانات الملف الشخصي قبل محاولة التحديث

    const hasChanges =
      form.username !== (profile.username || "") ||
      form.email !== (profile.email || "") ||
      Boolean(imageFile);

    if (!hasChanges) {
      toast("لا يوجد تغييرات للحفظ");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData(); // لإنشاء FormData لرفع الصورة مع البيانات الأخرى
      payload.append("username", form.username);
      payload.append("email", form.email);

      if (imageFile) {
        // إذا تم اختيار صورة جديدة، نضيفها إلى الـ FormData
        payload.append("profilePicture", imageFile);
      }

      const response = await axios.put(
        `${API_URL}/api/users/update-user/${profile._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updated = response.data?.user || response.data;
      setProfile(updated);
      setForm({
        username: updated?.username || "",
        email: updated?.email || "",
      });
      setImageFile(null);
      toast.success("تم تحديث البيانات بنجاح");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطا اثناء حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("ar-EG")
    : "--";

  const resolveImageUrl = (value) => {
    if (!value) return ""; // إذا القيمة فارغة، نرجع سلسلة فارغة عشان ما نحاول نعرض صورة
    if (value.startsWith("http://") || value.startsWith("https://"))
      // إذا كانت القيمة URL كامل، نرجعها كما هي
      return value;
    return `${API_URL}${value}`;
  };

  return (
    <section className="admin-profile">
      <div className="profile-shell">
        <header className="profile-hero">
          <div className="avatar-wrap">
            <img
              src={
                imageFile
                  ? URL.createObjectURL(imageFile)
                  : resolveImageUrl(profile?.profilePicture) ||
                    "https://static.vecteezy.com/system/resources/previews/036/280/650/non_2x/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg"
              }
              alt="Admin avatar"
              className="avatar"
            />
            <label className="upload-btn" htmlFor="profilePicture">
              تغيير الصورة
            </label>
            <input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </div>

          <div className="hero-meta">
            <h2>مرحبا، {profile?.username || "المدير"}</h2>
            <p>ادارة حساب المدير وتحديث البيانات الاساسية.</p>
            <div className="meta-row">
              <span>الدور: {profile?.role || "--"}</span>
              <span>تاريخ الانضمام: {joinedDate}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="profile-state">جار تحميل البيانات...</div>
        ) : error ? (
          <div className="profile-state error">{error}</div>
        ) : (
          <div className="profile-grid">
            <div className="profile-card">
              <h3>بيانات الحساب</h3>
              <form onSubmit={handleSubmit} className="profile-form">
                <label>
                  الاسم
                  <input
                    type="text"
                    name="username"
                    dir="auto"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="اسم المستخدم"
                  />
                </label>
                <label>
                  البريد الالكتروني
                  <input
                    type="email"
                    name="email"
                    dir="ltr"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="input-ltr"
                  />
                </label>
                <button type="submit" disabled={saving}>
                  {saving ? "جار الحفظ..." : "حفظ التعديلات"}
                </button>
              </form>
            </div>

            <div className="profile-card highlight">
              <h3>ملخص سريع</h3>
              <ul className="profile-stats">
                <li>
                  <span>المعرف</span>
                  <strong className="input-ltr">{profile?._id || "--"}</strong>
                </li>
                <li>
                  <span>البريد الالكتروني</span>
                  <strong className="input-ltr">
                    {profile?.email || "--"}
                  </strong>
                </li>
                <li>
                  <span>الحالة</span>
                  <strong>نشط</strong>
                </li>
              </ul>
              <div className="profile-note">
                يتم حفظ التعديلات مباشرة في حسابك بعد الضغط على الزر.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminProfile;
