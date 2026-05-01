import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { linksApi } from "../api/links";
import "../styles/rain-night.css";

export default function BatchManage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [newExpiry, setNewExpiry] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["links"],
    queryFn: () => linksApi.list(1, 100),
  });

  const deleteMutation = useMutation({
    mutationFn: linksApi.batchDelete,
    onSuccess: () => {
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ slugs, expires_at }: { slugs: string[]; expires_at: string }) =>
      linksApi.batchUpdate(slugs, expires_at),
    onSuccess: () => {
      setSelected([]);
      setNewExpiry("");
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleAll = () => {
    if (selected.length === data?.data.items.length) {
      setSelected([]);
    } else {
      setSelected(data?.data.items.map((link) => link.slug) || []);
    }
  };

  return (
    <div>
      <button onClick={() => navigate("/")} className="btn btn-secondary" style={{ marginBottom: "24px" }}>
        ← 返回链接列表
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">批量操作</h1>
          <p className="page-subtitle">多节点管理</p>
        </div>
        {selected.length > 0 && (
          <div className="selection-count">
            <span className="badge badge-purple">已选择 {selected.length} 项</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
          加载中...
        </div>
      ) : (
        <>
          <div className="cyber-card" style={{ marginBottom: "24px", padding: 0 }}>
            <table className="cyber-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>
                    <input
                      type="checkbox"
                      className="cyber-checkbox"
                      checked={selected.length === data?.data.items.length && data?.data.items.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>短链接</th>
                  <th>原始链接</th>
                  <th>点击</th>
                  <th>过期时间</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.items.map((link) => (
                  <tr key={link.slug}>
                    <td>
                      <input
                        type="checkbox"
                        className="cyber-checkbox"
                        checked={selected.includes(link.slug)}
                        onChange={() => toggle(link.slug)}
                      />
                    </td>
                    <td>
                      <Link to={`/links/${link.slug}`} style={{ color: "var(--rn-neon-cyan)", fontWeight: "bold" }}>
                        {link.slug}
                      </Link>
                    </td>
                    <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--rn-text-secondary)" }} title={link.url}>
                      {link.url}
                    </td>
                    <td>
                      <span className="badge badge-green">{link.click_count}</span>
                    </td>
                    <td>
                      {link.expires_at ? (
                        <span className="badge badge-yellow">{link.expires_at}</span>
                      ) : (
                        <span className="badge badge-cyan">永不过期</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cyber-card">
            <div className="cyber-card-body batch-actions">
              <div className="batch-action-group">
                <label className="batch-label">设置过期时间</label>
                <input
                  type="datetime-local"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="cyber-input"
                  style={{ width: "240px" }}
                />
              </div>

              <div className="batch-buttons">
                <button
                  onClick={() => updateMutation.mutate({ slugs: selected, expires_at: newExpiry })}
                  disabled={selected.length === 0 || !newExpiry}
                  className="btn btn-primary"
                >
                  更新过期时间 ({selected.length})
                </button>

                <button
                  onClick={() => deleteMutation.mutate(selected)}
                  disabled={selected.length === 0}
                  className="btn btn-danger"
                >
                  删除选中 ({selected.length})
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .batch-actions {
          display: flex;
          align-items: flex-end;
          gap: 24px;
          flex-wrap: wrap;
        }
        .batch-action-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .batch-label {
          font-family: var(--rn-font-display);
          font-size: 0.5625rem;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--rn-text-secondary);
          text-transform: uppercase;
        }
        .batch-buttons {
          display: flex;
          gap: 16px;
          margin-left: auto;
        }
        .selection-count {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
