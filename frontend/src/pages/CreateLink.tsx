import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { linksApi } from "../api/links";
import "../styles/rain-night.css";

export default function CreateLink() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ url: "", expires_at: "" });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const getQuickExpiry = (hours: number): string => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString().slice(0, 16);
  };

  const quickOptions = [
    { label: "1小时", hours: 1 },
    { label: "1天", hours: 24 },
    { label: "7天", hours: 168 },
    { label: "30天", hours: 720 },
    { label: "永不过期", hours: 0 },
  ];

  const handleQuickSelect = (hours: number) => {
    if (hours === 0) {
      setForm({ ...form, expires_at: "" });
    } else {
      setForm({ ...form, expires_at: getQuickExpiry(hours) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: { url: string; expires_at?: string } = { url: form.url };
      if (form.expires_at) data.expires_at = form.expires_at;
      await linksApi.create(data);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate("/")} className="btn btn-secondary" style={{ marginBottom: "24px" }}>
        ← 返回链接列表
      </button>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="page-header" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
          <h1 className="page-title">创建短链接</h1>
          <p className="page-subtitle">生成新的网络节点</p>
        </div>

        <div className="cyber-card" style={{ marginTop: "32px" }}>
          <div className="cyber-card-body">
            <form onSubmit={handleSubmit}>
              <div className={`form-group ${focusedField === "url" ? "focused" : ""}`}>
                <label>
                  <span className="label-icon">▸</span>
                  目标链接
                </label>
                <div className="input-wrapper">
                  <input
                    type="url"
                    placeholder="https://example.com/..."
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    onFocus={() => setFocusedField("url")}
                    onBlur={() => setFocusedField(null)}
                    required
                    disabled={loading}
                    className="cyber-input"
                  />
                  <div className="input-line" />
                </div>
              </div>

              <div className={`form-group ${focusedField === "expires_at" ? "focused" : ""}`}>
                <label>
                  <span className="label-icon">▸</span>
                  过期时间（可选）
                </label>

                <div className="quick-expiry-row">
                  {quickOptions.map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => handleQuickSelect(opt.hours)}
                      className={`quick-expiry-btn ${opt.hours === 0 ? (form.expires_at === "" ? "active" : "") : (form.expires_at === getQuickExpiry(opt.hours) ? "active" : "")}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="input-wrapper" style={{ marginTop: "12px" }}>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    onFocus={() => setFocusedField("expires_at")}
                    onBlur={() => setFocusedField(null)}
                    disabled={loading}
                    className="cyber-input"
                  />
                  <div className="input-line" />
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading} style={{ width: "100%", marginTop: "16px" }}>
                <span className="btn-text">{loading ? "生成中..." : "生成链接"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
