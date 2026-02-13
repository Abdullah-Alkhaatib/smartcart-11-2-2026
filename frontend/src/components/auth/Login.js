import "./login.css";
import { useContext, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { UserRoleContext } from "../UserRole";
import API_URL from "../../config/api";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {

    const { login } = useContext(UserRoleContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {

            const { data } = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            localStorage.setItem("token", data.token);
            login(data.role);

            toast.success("Login successful");

            window.location.href = "/";

        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">

            <div className="login-card">

                <h2>Login Page</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        placeholder="Email"
                        dir="ltr"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        required
                    />

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

                    <button disabled={loading}>
                        {loading ? "Signing in..." : "Login"}
                    </button>

                </form>

                <p>
                    Don't have an account?
                    <Link to="/register"> Register</Link>
                </p>

            </div>

        </div>
    );
}
