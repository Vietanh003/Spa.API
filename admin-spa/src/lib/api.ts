import axios from "axios";
import { useAuthStore } from "../store/auth";

const baseURL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (!token) return config;

  const h: any = config.headers;
  const hasAuthorization =
    (h && typeof h.has === "function" && h.has("Authorization")) ||
    (h && typeof h.get === "function" && Boolean(h.get("Authorization"))) ||
    Boolean((h as Record<string, unknown> | undefined)?.Authorization);

  if (hasAuthorization) return config;

  if (h && typeof h.set === "function") {
    h.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${token}` } as any;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);
