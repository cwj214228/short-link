import api from "./client";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<TokenResponse>("/auth/login", data),
  register: (data: LoginRequest) => api.post("/auth/register", data),
  refresh: (refresh_token: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token }),
};