import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { linksApi } from "../api/links";
import "../styles/rain-night.css";

export default function LinkDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["links", slug],
    queryFn: () => linksApi.get(slug!),
    enabled: !!slug,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
        加载中...
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <Link to="/" className="btn btn-secondary" style={{ marginBottom: "24px" }}>
          ← 返回链接列表
        </Link>
        <div className="error-box">
          <span className="error-icon">⚠</span>
          链接未找到
        </div>
      </div>
    );
  }

  const link = data.data;

  return (
    <div>
      <Link to="/" className="btn btn-secondary" style={{ marginBottom: "24px" }}>
        ← 返回链接列表
      </Link>

      <div className="page-header" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
        <h1 className="page-title" style={{ fontSize: "1.25rem" }}>链接详情</h1>
        <p className="page-subtitle">网络节点信息</p>
      </div>

      <div className="cyber-card" style={{ marginTop: "24px" }}>
        <div className="cyber-card-body" style={{ display: "grid", gap: "16px" }}>
          <div className="detail-row">
            <div className="detail-label">原始链接</div>
            <div className="detail-value">
              <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--rn-neon-cyan)", wordBreak: "break-all" }}>
                {link.url}
              </a>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">短链接</div>
            <div className="detail-value" style={{ color: "var(--rn-neon-magenta)", fontFamily: "var(--rn-font-display)" }}>
              {window.location.origin}/redirect/{link.slug}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div className="stat-box">
              <div className="stat-value">{link.click_count}</div>
              <div className="stat-label">总点击量</div>
            </div>
            <div className="stat-box">
              <div className="stat-value" style={{ color: link.expires_at ? "var(--rn-neon-yellow)" : "var(--rn-neon-green)" }}>
                {link.expires_at || "∞"}
              </div>
              <div className="stat-label">过期时间</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
            <div className="detail-row" style={{ background: "transparent", padding: "12px" }}>
              <div className="detail-label">创建时间</div>
              <div className="detail-value" style={{ fontSize: "0.875rem" }}>{link.created_at}</div>
            </div>
            <div className="detail-row" style={{ background: "transparent", padding: "12px" }}>
              <div className="detail-label">状态</div>
              <div className="detail-value">
                <span className="badge badge-green">活跃</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .detail-row {
          display: grid;
          gridTemplate-columns: 140px 1fr;
          gap: 16px;
          padding: 16px;
          background: var(--rn-bg-tertiary);
          border-radius: 8px;
          align-items: center;
        }
        .detail-label {
          font-family: var(--rn-font-display);
          font-size: 0.5625rem;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--rn-text-secondary);
          text-transform: uppercase;
        }
        .detail-value {
          font-family: var(--rn-font-mono);
          font-size: 0.9375rem;
          color: var(--rn-text-primary);
        }
        .stat-box {
          background: var(--rn-bg-tertiary);
          border: 1px solid var(--rn-border);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
        }
        .stat-value {
          font-family: var(--rn-font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--rn-neon-cyan);
          text-shadow: var(--rn-glow-cyan);
          margin-bottom: 8px;
        }
        .stat-label {
          font-family: var(--rn-font-display);
          font-size: 0.5625rem;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--rn-text-secondary);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
