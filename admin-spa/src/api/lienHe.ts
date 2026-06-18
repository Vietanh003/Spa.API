import { api } from "../lib/api";

export type LienHeRow = {
  id: number;
  hoTen: string;
  dienThoai: string;
  email: string | null;
  loiNhan: string;
  createdAt: string;
  daXem: boolean;
  xemLuc: string | null;
  xemBoi: string | null;
};

export type LienHeListResult = {
  items: LienHeRow[];
  unreadCount: number;
};

export type LienHeCreateDto = {
  hoTen: string;
  dienThoai: string;
  email?: string | null;
  loiNhan: string;
};

export const lienHeApi = {
  // Public
  submit: async (dto: LienHeCreateDto) =>
    (await api.post<{ id: number; message: string }>("/api/public/lien-he", dto)).data,

  // Admin
  list: async (params: { q?: string; unread?: boolean; take?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.unread !== undefined) sp.set("unread", String(params.unread));
    if (params.take !== undefined) sp.set("take", String(params.take));
    const url = sp.toString() ? `/api/admin/lien-he?${sp}` : "/api/admin/lien-he";
    return (await api.get<LienHeListResult>(url)).data;
  },

  get: async (id: number) =>
    (await api.get<LienHeRow>(`/api/admin/lien-he/${id}`)).data,

  markRead: async (id: number, value = true) =>
    (await api.put(`/api/admin/lien-he/${id}/read?value=${value}`)).data,

  remove: async (id: number) =>
    (await api.delete(`/api/admin/lien-he/${id}`)).data,
};
