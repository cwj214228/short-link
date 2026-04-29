import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { linksApi } from "../api/links";

export default function CreateLink() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ url: "", expires_at: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: { url: string; expires_at?: string } = { url: form.url };
    if (form.expires_at) data.expires_at = form.expires_at;
    await linksApi.create(data);
    navigate("/");
  };

  return (
    <div>
      <h1>Create Link</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="https://example.com/..."
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          required
        />
        <input
          type="datetime-local"
          placeholder="Expires at (optional)"
          value={form.expires_at}
          onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}