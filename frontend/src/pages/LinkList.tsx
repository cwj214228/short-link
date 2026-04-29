import { useQuery } from "@tanstack/react-query";
import { linksApi } from "../api/links";
import { Link, useNavigate } from "react-router-dom";

export default function LinkList() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["links"],
    queryFn: () => linksApi.list(),
  });

  return (
    <div>
      <h1>My Links</h1>
      <button onClick={() => navigate("/create")}>Create New</button>
      <button onClick={() => navigate("/batch")}>Batch Manage</button>
      <table>
        <thead>
          <tr>
            <th>Slug</th>
            <th>URL</th>
            <th>Clicks</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.items.map((link) => (
            <tr key={link.slug}>
              <td><Link to={`/links/${link.slug}`}>{link.slug}</Link></td>
              <td>{link.url}</td>
              <td>{link.click_count}</td>
              <td>{link.expires_at || "Never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}