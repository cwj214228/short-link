import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import "../styles/rain-night.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await authApi.login(form);
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
      navigate("/");
    } catch {
      setError("登录失败：用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rain-night-bg">
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      <div className="login-container">
        <div className="login-header">
          <div className="logo-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <h1 className="login-title">短链接</h1>
          <p className="login-subtitle">网络控制中心</p>
        </div>

        <div className="login-card">
          <div className="card-glow" />
          <div className="card-content">
            <div className="card-header">
              <span className="card-title">用户登录</span>
              <span className="card-status">
                <span className="status-dot" />
                在线
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={`form-group ${focusedField === "username" ? "focused" : ""}`}>
                <label>
                  <span className="label-icon">▸</span>
                  用户名
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="请输入用户名..."
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    required
                    disabled={loading}
                  />
                  <div className="input-line" />
                </div>
              </div>

              <div className={`form-group ${focusedField === "password" ? "focused" : ""}`}>
                <label>
                  <span className="label-icon">▸</span>
                  密码
                </label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    placeholder="请输入密码..."
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    disabled={loading}
                  />
                  <div className="input-line" />
                </div>
              </div>

              {error && (
                <div className="error-box">
                  <span className="error-icon">⚠</span>
                  {error}
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                <span className="btn-text">{loading ? "登录中..." : "登录"}</span>
              </button>
            </form>

            <div className="login-footer">
              <span>没有账号？</span>
              <Link to="/register" className="link-neon">
                立即注册
                <span style={{ marginLeft: "4px" }}>→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="version-info">
          <span>v1.0.0</span>
          <span className="separator">|</span>
          <span>系统在线</span>
        </div>
      </div>
    </div>
  );
}
