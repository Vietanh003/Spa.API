import { api } from "../lib/api";

export type DichVuRow = {
  id: number;
  maDichVu: string;
  tenDichVu: string;
  giaHienTai: number;
  giaGoc: number | null;
  thoiLuongPhut: number | null;
  isActive: boolean;
  isOnlineVisible: boolean;
  danhMucId: number | null;
  danhMucTen: string | null;
};

export type DichVuDetail = {
  id: number;
  maDichVu: string;
  tenDichVu: string;
  moTaNgan: string | null;
  moTa: string | null;
  lieuTrinh: string | null;
  giaHienTai: number;
  giaGoc: number | null;
  phanTramGiam: number | null;
  apDungTu: string | null;
  apDungDen: string | null;
  thoiLuongPhut: number | null;
  soBuoi: number | null;
  thoiGianHieuLucNgay: number | null;
  sku: string | null;
  barcode: string | null;
  isCombo: boolean;
  isOnlineVisible: boolean;
  isActive: boolean;
  thuTuHienThi: number | null;
  hinhAnhChinh: string | null;
  hinhAnhJson: string | null;
  slug: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  danhMucId: number | null;
  danhMucTen: string | null;
};

export type CreateDto = {
  danhMucId?: number | null;
  maDichVu: string;
  tenDichVu: string;
  moTaNgan?: string | null;
  moTa?: string | null;
  lieuTrinh?: string | null;
  giaHienTai: number;
  giaGoc?: number | null;
  phanTramGiam?: number | null;
  apDungTu?: string | null;
  apDungDen?: string | null;
  thoiLuongPhut?: number | null;
  soBuoi?: number | null;
  thoiGianHieuLucNgay?: number | null;
  sku?: string | null;
  barcode?: string | null;
  isCombo?: boolean;
  isOnlineVisible?: boolean;
  isActive?: boolean;
  thuTuHienThi?: number | null;
  hinhAnhChinh?: string | null;
  hinhAnhJson?: string | null;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type UpdateDto = Omit<CreateDto, "maDichVu"> & {
  tenDichVu: string;
  giaHienTai: number;
};

export const dvApi = {
  list: async (params: { active?: boolean; danhMucId?: number; q?: string }) => {
    const sp = new URLSearchParams();
    if (params.active !== undefined) sp.set("active", String(params.active));
    if (params.danhMucId !== undefined) sp.set("danhMucId", String(params.danhMucId));
    if (params.q) sp.set("q", params.q);
    const url = sp.toString() ? `/api/dich-vu?${sp}` : "/api/dich-vu";
    return (await api.get<DichVuRow[]>(url)).data;
  },
  get: async (id: number) => (await api.get<DichVuDetail>(`/api/dich-vu/${id}`)).data,
  create: async (dto: CreateDto) => (await api.post("/api/dich-vu", dto)).data,
  update: async (id: number, dto: UpdateDto) => (await api.put(`/api/dich-vu/${id}`, dto)).data,
  remove: async (id: number) => (await api.delete(`/api/dich-vu/${id}`)).data,
};
