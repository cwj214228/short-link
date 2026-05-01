import api from "./client";

export interface LinkResponse {
  slug: string;
  url: string;
  short_url: string;
  user_id: number;
  click_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface LinkListResponse {
  items: LinkResponse[];
  total: number;
  page: number;
  limit: number;
}

export const linksApi = {
  list: (page = 1, limit = 10, search?: string) =>
    api.get<LinkListResponse>("/links", { params: { page, limit, search } }),
  create: (data: { url: string; expires_at?: string }) =>
    api.post<LinkResponse>("/links", data),
  get: (slug: string) => api.get<LinkResponse>(`/links/${slug}`),
  update: (slug: string, data: { url?: string; expires_at?: string }) =>
    api.put<LinkResponse>(`/links/${slug}`, data),
  delete: (slug: string) => api.delete(`/links/${slug}`),
  batchDelete: (slugs: string[]) => api.post("/links/batch/delete", { slugs }),
  batchUpdate: (slugs: string[], expires_at: string) =>
    api.post("/links/batch/update", { slugs, expires_at }),
};
