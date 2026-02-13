import "./register.css";
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import API_URL from "../../config/api";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {

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
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password
      });

      toast.success("Registration successful");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">

      <div className="register-card">

        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Username"
            dir="auto"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            dir="ltr"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              dir="auto"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />

            <span
              className="show-password"
              onClick={()=>setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              dir="auto"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              required
            />

            <span
              className="show-password"
              onClick={()=>setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </span>
          </div>

          <button disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>

        </form>

        <p>
          Already have an account?
          <Link to="/login"> Login</Link>
        </p>

      </div>

    </div>
  );
}
