import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { linksApi } from "../api/links";

export default function LinkDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useQuery({
    queryKey: ["links", slug],
    queryFn: () => linksApi.get(slug!),
    enabled: !!slug,
    refetchInterval: 30000, // poll every 30 seconds
  });

  if (!data) return <div>Loading...</div>;

  const link = data.data;

  return (
    <div>
      <h1>Link: {link.slug}</h1>
      <p>Original URL: <a href={link.url}>{link.url}</a></p>
      <p>Clicks: {link.click_count}</p>
      <p>Created: {link.created_at}</p>
      <p>Expires: {link.expires_at || "Never"}</p>
      <p>Short URL: {link.short_url}</p>
    </div>
  );
}