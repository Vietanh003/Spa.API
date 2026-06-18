import { api } from "../lib/api";
import { useCustomerAuthStore } from "../customer/store/auth";

export type LichHenAvailabilityDay = {
  date: string; // DateOnly => "YYYY-MM-DD"
  slots: string[]; // TimeOnly => usually "HH:mm:ss" (or "HH:mm")
};

export type CustomerBookingRow = {
  id: number;
  ngayHen: string;
  gioHen: string;
  thoiLuongDuKien: number;
  trangThai: string;
  dichVuId: number;
  tenDichVu?: string | null;
  hoTenKhach: string;
  dienThoaiKhach: string;
  emailKhach?: string | null;
  ghiChuKhach?: string | null;
  lyDoHuy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  daDen: boolean;
};

function customerAuthHeaders() {
  const token = useCustomerAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export const lichHenApi = {
  available: async (params?: { from?: string; days?: number; slotMinutes?: number }) => {
    const res = await api.get<LichHenAvailabilityDay[]>("/api/lich-hen/available", {
      params: {
        from: params?.from,
        days: params?.days ?? 14,
        slotMinutes: params?.slotMinutes ?? 30,
      },
    });
    return res.data;
  },
  create: async (body: {
    hoTenKhach: string;
    dienThoaiKhach: string;
    emailKhach?: string;
    ngayHen: string; // YYYY-MM-DD
    gioHen: string; // HH:mm:ss or HH:mm
    dichVuId: number;
    thoiLuongDuKien: number; // minutes
    ghiChuKhach?: string;
  }) => {
    const res = await api.post<any>("/api/lich-hen", body, {
      headers: customerAuthHeaders(),
    });
    return res.data;
  },
  my: async () => {
    const res = await api.get<CustomerBookingRow[]>("/api/lich-hen/my", {
      headers: customerAuthHeaders(),
    });
    return res.data;
  },
  // staff endpoints (require Bearer token)
  list: async (params?: { from?: string; to?: string; status?: string; nhanVienId?: number; take?: number }) => {
    const res = await api.get<any[]>('/api/lich-hen', {
      params: {
        from: params?.from,
        to: params?.to,
        status: params?.status,
        nhanVienId: params?.nhanVienId,
        take: params?.take ?? 200,
      },
    });
    return res.data;
  },
  confirm: async (id: number, body: { nhanVienId?: number | null; ghiChuNoiBo?: string }) => {
    const payload: { nhanVienId?: number; ghiChuNoiBo?: string } = {};
    if (typeof body.nhanVienId === "number" && body.nhanVienId > 0) payload.nhanVienId = body.nhanVienId;
    if (body.ghiChuNoiBo) payload.ghiChuNoiBo = body.ghiChuNoiBo;
    const res = await api.put<any>(`/api/lich-hen/${id}/confirm`, payload);
    return res.data;
  },
  complete: async (id: number) => {
    const res = await api.put<any>(`/api/lich-hen/${id}/complete`);
    return res.data;
  },
};
