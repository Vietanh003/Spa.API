import { api } from "../lib/api";

export type DanhMucDichVu = {
  id: number;
  maDanhMuc: string;
  tenDanhMuc: string;
  moTa: string | null;
  thuTu: number | null;
  isActive: boolean;
};
export type DanhMucOption = Pick<DanhMucDichVu, "id" | "maDanhMuc" | "tenDanhMuc" | "isActive">;
export type CreateDto = {
  maDanhMuc: string;
  tenDanhMuc: string;
  moTa?: string | null;
  thuTu?: number | null;
  isActive?: boolean;
};

export type UpdateDto = {
  tenDanhMuc: string;
  moTa?: string | null;
  thuTu?: number | null;
  isActive?: boolean;
};

export const dmApi = {
  list: async () => (await api.get<DanhMucDichVu[]>("/api/danh-muc-dich-vu")).data,
  get: async (id: number) => (await api.get(`/api/danh-muc-dich-vu/${id}`)).data,
  create: async (dto: CreateDto) => (await api.post("/api/danh-muc-dich-vu", dto)).data,
  update: async (id: number, dto: UpdateDto) => (await api.put(`/api/danh-muc-dich-vu/${id}`, dto)).data,
  remove: async (id: number) => (await api.delete(`/api/danh-muc-dich-vu/${id}`)).data,
};

export const danhMucApi = {
  list: async () => (await api.get<DanhMucOption[]>("/api/danh-muc-dich-vu")).data,
};