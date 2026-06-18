import { api } from "../lib/api";

export type DashboardStats = {
  asOf: string;
  today: {
    revenue: number;
    bookings: number;
    pending: number;
    confirmed: number;
    newContacts24h: number;
    revenueChangePct: number | null;
    bookingsChangeAbs: number;
  };
  yesterday: {
    revenue: number;
    bookings: number;
  };
  month: {
    revenue: number;
    bookings: number;
  };
  totals: {
    activeServices: number;
    pendingBookings: number;
    unreadContacts: number;
    publishedPosts: number;
  };
  weekly: {
    labels: string[];
    revenue: number[];
    bookings: number[];
  };
  comparisons: {
    bookingsTodayVsYesterday: number;
    bookingsYesterdayVsDayBefore: number;
  };
  topServices: Array<{
    id: number;
    tenDichVu: string;
    count: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: number;
    hoTenKhach: string;
    dienThoaiKhach: string;
    ngayHen: string;
    gioHen: string;
    trangThai: string;
    dichVuId: number;
    tenDichVu: string | null;
    gia: number;
  }>;
};

export const dashboardApi = {
  stats: async () => (await api.get<DashboardStats>("/api/admin/dashboard/stats")).data,
};
