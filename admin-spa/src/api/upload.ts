import type { AxiosProgressEvent } from "axios";
import { api } from "../lib/api";

export type UploadResult = {
  url: string;
  fileName: string;
  size?: number;
  kind?: "image" | "video";
};

function buildUploadOptions(onProgress?: (pct: number) => void) {
  if (!onProgress) return undefined;
  return {
    onUploadProgress: (e: AxiosProgressEvent) => {
      if (!e.total) return;
      onProgress(Math.round((e.loaded / e.total) * 100));
    },
  };
}

export const uploadApi = {
  image: async (file: File, folder?: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    const res = await api.post<UploadResult>(`/api/admin/upload/image${qs}`, form, buildUploadOptions(onProgress));
    return res.data;
  },

  video: async (file: File, folder?: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    // Video có thể lớn → tăng timeout 5 phút cho riêng request này
    const res = await api.post<UploadResult>(`/api/admin/upload/video${qs}`, form, {
      ...buildUploadOptions(onProgress),
      timeout: 5 * 60 * 1000,
    });
    return res.data;
  },
};
