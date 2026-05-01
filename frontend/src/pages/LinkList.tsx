import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { linksApi } from "../api/links";
import "../styles/rain-night.css";

const PAGE_SIZE = 10;

export default function LinkList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyToClipboard = (slug: string) => {
    const shortUrl = `${window.location.origin}/redirect/${slug}`;
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["links", page, search],
    queryFn: () => linksApi.list(page, PAGE_SIZE, search || undefined),
  });

  const filteredItems = data?.data.items || [];
  const totalPages = Math.ceil((data?.data.total || 0) / PAGE_SIZE);

  return (
    <div>
      <div className="page-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "20px" }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">我的链接</h1>
            <p className="page-subtitle">网络短链接管理</p>
          </div>
          <button onClick={() => navigate("/create")} className="btn btn-primary">+ 创建链接</button>
        </div>

        {/* Enhanced Search Box */}
        <div className="search-container">
          <div className={`search-box-wrapper ${isSearchFocused ? "focused" : ""}`}>
            {/* HUD Corner Brackets */}
            <div className="hud-corner hud-tl" />
            <div className="hud-corner hud-tr" />
            <div className="hud-corner hud-bl" />
            <div className="hud-corner hud-br" />

            <div className="search-inner">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="搜索原始链接..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="search-input-enhanced"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="search-clear-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {search && (
              <div className="search-hint">
                按下回车搜索 · ESC 清除
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
          加载中...
        </div>
      ) : (
        <div className="cyber-card">
          {filteredItems.length === 0 ? (
            <div className="cyber-card-body" style={{ textAlign: "center", padding: "64px 32px" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--rn-text-muted)", marginBottom: "16px" }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <p style={{ color: "var(--rn-text-muted)", marginBottom: "16px" }}>
                {search ? "未找到匹配的链接" : "暂无链接"}
              </p>
              {!search && (
                <button onClick={() => navigate("/create")} className="btn btn-primary">创建你的第一个链接</button>
              )}
            </div>
          ) : (
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>短链接</th>
                  <th>原始链接</th>
                  <th>点击</th>
                  <th>过期时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((link) => (
                  <tr key={link.slug}>
                    <td>
                      <Link to={`/links/${link.slug}`} style={{ color: "var(--rn-neon-cyan)", fontWeight: "bold", fontFamily: "var(--rn-font-display)" }}>
                        {link.slug}
                      </Link>
                    </td>
                    <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--rn-text-secondary)" }} title={link.url}>
                      {link.url}
                    </td>
                    <td>
                      <span className="badge badge-green">{link.click_count}</span>
                    </td>
                    <td>
                      {link.expires_at ? (
                        <span className={`badge ${new Date(link.expires_at) < new Date() ? 'badge-red' : 'badge-yellow'}`}>
                          {link.expires_at}
                        </span>
                      ) : (
                        <span className="badge badge-cyan">永不过期</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => copyToClipboard(link.slug)}
                          className={`btn btn-copy ${copiedSlug === link.slug ? "copied" : ""}`}
                          title="复制链接"
                        >
                          {copiedSlug === link.slug ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                        <Link to={`/links/${link.slug}`}>
                          <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.5625rem" }}>查看</button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ padding: "8px 16px" }}
              >
                ← 上一页
              </button>

              <div className="pagination-info">
                <span className="badge badge-purple">第 {page} / {totalPages} 页</span>
                <span style={{ color: "var(--rn-text-muted)", fontSize: "0.75rem" }}>
                  共 {data?.data.total || 0} 条
                </span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={{ padding: "8px 16px" }}
              >
                下一页 →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .search-container {
          width: 100%;
        }

        .search-box-wrapper {
          position: relative;
          background: linear-gradient(180deg, rgba(13, 13, 24, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%);
          border: 1px solid var(--rn-border-bright);
          border-radius: 12px;
          padding: 3px;
          transition: all var(--rn-duration-normal) ease;
        }

        .search-box-wrapper.focused {
          border-color: var(--rn-neon-cyan);
          box-shadow:
            0 0 20px rgba(0, 212, 255, 0.3),
            0 0 40px rgba(0, 212, 255, 0.1),
            inset 0 0 20px rgba(0, 212, 255, 0.05);
        }

        /* HUD Corner Brackets */
        .hud-corner {
          position: absolute;
          width: 12px;
          height: 12px;
          pointer-events: none;
        }

        .hud-corner::before,
        .hud-corner::after {
          content: '';
          position: absolute;
          background: var(--rn-neon-cyan);
          opacity: 0.7;
          transition: opacity var(--rn-duration-fast) ease;
        }

        .search-box-wrapper.focused .hud-corner::before,
        .search-box-wrapper.focused .hud-corner::after {
          opacity: 1;
          box-shadow: 0 0 6px var(--rn-neon-cyan);
        }

        .hud-tl { top: -1px; left: -1px; }
        .hud-tl::before { width: 12px; height: 2px; top: 0; left: 0; }
        .hud-tl::after { width: 2px; height: 12px; top: 0; left: 0; }

        .hud-tr { top: -1px; right: -1px; }
        .hud-tr::before { width: 12px; height: 2px; top: 0; right: 0; }
        .hud-tr::after { width: 2px; height: 12px; top: 0; right: 0; }

        .hud-bl { bottom: -1px; left: -1px; }
        .hud-bl::before { width: 12px; height: 2px; bottom: 0; left: 0; }
        .hud-bl::after { width: 2px; height: 12px; bottom: 0; left: 0; }

        .hud-br { bottom: -1px; right: -1px; }
        .hud-br::before { width: 12px; height: 2px; bottom: 0; right: 0; }
        .hud-br::after { width: 2px; height: 12px; bottom: 0; right: 0; }

        .search-inner {
          display: flex;
          align-items: center;
          background: var(--rn-bg-tertiary);
          border-radius: 8px;
          padding: 4px 16px;
          gap: 12px;
        }

        .search-icon {
          color: var(--rn-neon-cyan);
          opacity: 0.7;
          flex-shrink: 0;
          filter: drop-shadow(0 0 4px rgba(0, 212, 255, 0.5));
        }

        .search-box-wrapper.focused .search-icon {
          opacity: 1;
          animation: searchPulse 1.5s ease-in-out infinite;
        }

        @keyframes searchPulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(0, 212, 255, 0.5)); }
          50% { filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.9)); }
        }

        .search-input-enhanced {
          flex: 1;
          padding: 12px 0;
          font-family: var(--rn-font-mono);
          font-size: 0.9375rem;
          background: transparent;
          border: none;
          color: var(--rn-text-primary);
          outline: none;
        }

        .search-input-enhanced::placeholder {
          color: var(--rn-text-muted);
        }

        .search-clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          background: rgba(255, 0, 128, 0.1);
          border: 1px solid var(--rn-neon-magenta);
          border-radius: 6px;
          color: var(--rn-neon-magenta);
          cursor: pointer;
          transition: all var(--rn-duration-fast) ease;
        }

        .search-clear-btn:hover {
          background: rgba(255, 0, 128, 0.2);
          box-shadow: 0 0 10px rgba(255, 0, 128, 0.4);
        }

        .search-hint {
          text-align: center;
          padding: 8px;
          font-family: var(--rn-font-display);
          font-size: 0.5625rem;
          letter-spacing: 2px;
          color: var(--rn-text-muted);
          text-transform: uppercase;
          border-top: 1px solid var(--rn-border);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          padding: 24px;
          border-top: 1px solid var(--rn-border);
        }

        .pagination-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-copy {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid var(--rn-neon-cyan);
          border-radius: 6px;
          color: var(--rn-neon-cyan);
          cursor: pointer;
          transition: all var(--rn-duration-fast) ease;
        }

        .btn-copy:hover {
          background: rgba(0, 212, 255, 0.2);
          box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
          transform: scale(1.05);
        }

        .btn-copy.copied {
          background: rgba(0, 255, 136, 0.2);
          border-color: var(--rn-neon-green, #00ff88);
          color: var(--rn-neon-green, #00ff88);
          box-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
        }
      `}</style>
    </div>
  );
}
