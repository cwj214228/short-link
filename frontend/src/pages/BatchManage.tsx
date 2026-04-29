import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { linksApi } from "../api/links";
import { useNavigate } from "react-router-dom";

export default function BatchManage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [newExpiry, setNewExpiry] = useState("");

  const { data } = useQuery({
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

  return (
    <div>
      <h1>Batch Manage</h1>
      <button onClick={() => navigate("/")}>Back</button>
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Slug</th>
            <th>URL</th>
            <th>Clicks</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.items.map((link) => (
            <tr key={link.slug}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(link.slug)}
                  onChange={() => toggle(link.slug)}
                />
              </td>
              <td>{link.slug}</td>
              <td>{link.url}</td>
              <td>{link.click_count}</td>
              <td>{link.expires_at || "Never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => deleteMutation.mutate(selected)} disabled={selected.length === 0}>
          Delete Selected
        </button>
        <input
          type="datetime-local"
          value={newExpiry}
          onChange={(e) => setNewExpiry(e.target.value)}
        />
        <button
          onClick={() => updateMutation.mutate({ slugs: selected, expires_at: newExpiry })}
          disabled={selected.length === 0 || !newExpiry}
        >
          Update Expiry
        </button>
      </div>
    </div>
  );
}