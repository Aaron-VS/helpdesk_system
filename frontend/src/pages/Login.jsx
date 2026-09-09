import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const user = response.data.data;

      localStorage.setItem("token", user.token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "Customer") {
        navigate("/customer");
      } else if (user.role === "Agent") {
        navigate("/agent");
      } else if (user.role === "Manager") {
        navigate("/manager");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <div className="brand-icon">🎧</div>
          <h1>HelpDesk</h1>
          <p>Support made simple.</p>
        </div>

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-demo">
          <p>Demo accounts</p>
          <small>Customer: customer@test.com</small>
          <small>Agent: agent@test.com</small>
          <small>Manager: manager@helpdesk.com</small>
        </div>
      </div>
    </div>
  );
}

export default Login;