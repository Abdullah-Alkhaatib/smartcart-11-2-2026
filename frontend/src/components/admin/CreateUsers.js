import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { PlusCircle, UploadCloud } from "lucide-react";
import "../admin/createUsers.css";
import API_URL from "../../config/api";

const CreateUsers = ({ onCreated }) => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
  };

  const resetForm = () => {
    setForm({
      username: "",
      email: "",
      password: "",
      role: "user",
    });
    setImageFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.username || !form.email || !form.password) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }

    if (!token) {
      toast.error("يرجى تسجيل الدخول مرة اخرى");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("username", form.username);
      payload.append("email", form.email);
      payload.append("password", form.password);
      payload.append("role", form.role);

      if (imageFile) {
        payload.append("profilePicture", imageFile);
      }

      await axios.post(`${API_URL}/api/users/create-user`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("تم انشاء المستخدم بنجاح");
      resetForm();
      if (onCreated) {
        onCreated();
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطا اثناء انشاء المستخدم");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="create-users">
      <div className="create-users__card">
        <div className="create-users__header">
          <div>
            <h3>اضافة مستخدم جديد</h3>
            <p>ادخل بيانات المستخدم وحدد صلاحياته وصورته الشخصية.</p>
          </div>
          <span className="create-users__badge">
            <PlusCircle size={18} />
            جديد
          </span>
        </div>

        <form className="create-users__form" onSubmit={handleSubmit}>
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

          <label>
            كلمة المرور
            <input
              type="password"
              name="password"
              dir="auto"
              value={form.password}
              onChange={handleChange}
              placeholder="********"
              className="input-ltr"
            />
          </label>

          <label>
            الدور
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="user">مستخدم</option>
              <option value="admin">مدير</option>
            </select>
          </label>

          <label className="upload-field">
            الصورة الشخصية
            <span className="upload-box">
              <UploadCloud size={18} />
              {imageFile ? imageFile.name : "اضغط لاختيار صورة"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </span>
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "جار الحفظ..." : "انشاء المستخدم"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreateUsers;
