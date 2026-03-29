import axios, { type AxiosError } from "axios";

const client = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = localStorage.getItem("accessToken");
let refreshToken: string | null = localStorage.getItem("refreshToken");

export function setTokens(access: string | null, refresh: string | null): void {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem("accessToken", access);
  else localStorage.removeItem("accessToken");
  if (refresh) localStorage.setItem("refreshToken", refresh);
  else localStorage.removeItem("refreshToken");
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearTokens(): void {
  setTokens(null, null);
}

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      original &&
      !(original as { _retry?: boolean })._retry &&
      refreshToken
    ) {
      (original as { _retry?: boolean })._retry = true;
      try {
        const { data } = await axios.post<{ accessToken: string }>(
          "/api/auth/refresh",
          { refreshToken }
        );
        setTokens(data.accessToken, refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch {
        clearTokens();
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }
    return Promise.reject(err);
  }
);

export default client;
