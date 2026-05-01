import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import "../styles/rain-night.css";

export default function Register() {
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
      await authApi.register(form);
      navigate("/login");
    } catch {
      setError("注册失败：用户名已存在");
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="login-title">创建账号</h1>
          <p className="login-subtitle">加入网络</p>
        </div>

        <div className="login-card">
          <div className="card-glow" />
          <div className="card-content">
            <div className="card-header">
              <span className="card-title">新用户注册</span>
              <span className="card-status" style={{ color: "var(--rn-neon-yellow)" }}>
                <span className="status-dot" style={{ background: "var(--rn-neon-yellow)", boxShadow: "0 0 8px rgba(255, 238, 0, 0.6)" }} />
                待处理
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
                    placeholder="设置用户名..."
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
                    placeholder="设置密码..."
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
                <span className="btn-text">{loading ? "创建中..." : "注册"}</span>
              </button>
            </form>

            <div className="login-footer">
              <span>已有账号？</span>
              <Link to="/login" className="link-neon">
                立即登录
                <span style={{ marginLeft: "4px" }}>→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="version-info">
          <span>v1.0.0</span>
          <span className="separator">|</span>
          <span>安全注册</span>
        </div>
      </div>
    </div>
  );
}
