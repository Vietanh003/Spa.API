import axios from "axios";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: "",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    // Axios v1: headers có thể là AxiosHeaders => dùng .set
    const h: any = config.headers;
    if (h && typeof h.set === "function") {
      h.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${token}` } as any;
    }
  }

  return config;
});


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      useAuthStore.getState().logout();
      // router sẽ đá về /login khi reload hoặc khi điều hướng
    }
    return Promise.reject(err);
  }
);
