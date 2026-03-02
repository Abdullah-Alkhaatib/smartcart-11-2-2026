import "./register.css";
import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API_URL from "../../config/api";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    if (password.length < 6) {
      toast.error("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
      });

      toast.success("تم إنشاء الحساب بنجاح");
      navigate("/login");
    } catch (error) {
      const backendMessage = error.response?.data?.message;

      if (backendMessage === "Username already exists") {
        toast.error("اسم المستخدم مستخدم بالفعل");
      } else if (backendMessage === "Email already exists") {
        toast.error("البريد الإلكتروني مستخدم بالفعل");
      } else {
        toast.error("فشل إنشاء الحساب");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>إنشاء حساب</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            autoComplete="username"
            placeholder="اسم المستخدم"
            dir="auto"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="البريد الإلكتروني"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              placeholder="كلمة المرور"
              dir="auto"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              className="show-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="تأكيد كلمة المرور"
              dir="auto"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <span
              className="show-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </span>
          </div>

          <button disabled={loading}>
            {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
          </button>
        </form>

        <p>
          لديك حساب بالفعل؟
          <Link to="/login"> تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
