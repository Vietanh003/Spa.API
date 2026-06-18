import { api } from "../lib/api";
import type { DichVuDetail } from "./dichVu";

export type DichVuPublicRow = {
  id: number;
  maDichVu: string;
  tenDichVu: string;
  moTaNgan: string | null;
  giaHienTai: number;
  giaGoc: number | null;
  phanTramGiam: number | null;
  thoiLuongPhut: number | null;
  soBuoi: number | null;
  hinhAnhChinh: string | null;
  slug: string | null;
  danhMucId: number | null;
  danhMucTen: string | null;

  // Một số backend có thể vẫn trả 2 field này; để optional cho an toàn
  isActive?: boolean;
  isOnlineVisible?: boolean;
};

export const dvPublicApi = {
  list: async (params: { danhMucId?: number; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.danhMucId !== undefined) sp.set("danhMucId", String(params.danhMucId));
    if (params.q) sp.set("q", params.q);

    const url = sp.toString() ? `/api/public/dich-vu?${sp}` : "/api/public/dich-vu";
    return (await api.get<DichVuPublicRow[]>(url)).data;
  },
  get: async (id: number) => (await api.get<DichVuDetail>(`/api/public/dich-vu/${id}`)).data,
};
