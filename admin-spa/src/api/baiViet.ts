import { api } from "../lib/api";

export type BaiVietPublicRow = {
  id: number;
  slug: string;
  tieuDe: string;
  moTaNgan: string | null;
  danhMuc: string | null;
  anhBia: string | null;
  tacGia: string | null;
  thoiGianDocPhut: number | null;
  ngayDang: string; // ISO
};

export type BaiVietPublicDetail = BaiVietPublicRow & {
  noiDung: string | null;
  videoUrl: string | null;
};

export type BaiVietAdminRow = {
  id: number;
  slug: string;
  tieuDe: string;
  moTaNgan: string | null;
  danhMuc: string | null;
  anhBia: string | null;
  videoUrl: string | null;
  tacGia: string | null;
  thoiGianDocPhut: number | null;
  isPublished: boolean;
  ngayDang: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type BaiVietAdminDetail = BaiVietAdminRow & {
  noiDung: string | null;
};

export type BaiVietCreateDto = {
  slug: string;
  tieuDe: string;
  moTaNgan?: string | null;
  noiDung?: string | null;
  danhMuc?: string | null;
  anhBia?: string | null;
  videoUrl?: string | null;
  tacGia?: string | null;
  thoiGianDocPhut?: number | null;
  isPublished?: boolean;
  ngayDang?: string | null;
};

export type BaiVietUpdateDto = Omit<BaiVietCreateDto, "slug">;

export const baiVietPublicApi = {
  list: async (params: { q?: string; danhMuc?: string; take?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.danhMuc) sp.set("danhMuc", params.danhMuc);
    if (params.take !== undefined) sp.set("take", String(params.take));
    const url = sp.toString() ? `/api/public/blog?${sp}` : "/api/public/blog";
    return (await api.get<BaiVietPublicRow[]>(url)).data;
  },
  getBySlug: async (slug: string) =>
    (await api.get<BaiVietPublicDetail>(`/api/public/blog/${encodeURIComponent(slug)}`)).data,
};

export const baiVietAdminApi = {
  list: async (params: { q?: string; published?: boolean; take?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.published !== undefined) sp.set("published", String(params.published));
    if (params.take !== undefined) sp.set("take", String(params.take));
    const url = sp.toString() ? `/api/admin/blog?${sp}` : "/api/admin/blog";
    return (await api.get<BaiVietAdminRow[]>(url)).data;
  },
  get: async (id: number) => (await api.get<BaiVietAdminDetail>(`/api/admin/blog/${id}`)).data,
  create: async (dto: BaiVietCreateDto) => (await api.post("/api/admin/blog", dto)).data,
  update: async (id: number, dto: BaiVietUpdateDto) =>
    (await api.put(`/api/admin/blog/${id}`, dto)).data,
  remove: async (id: number) => (await api.delete(`/api/admin/blog/${id}`)).data,
};
