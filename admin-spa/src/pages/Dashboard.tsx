// src/pages/Dashboard.tsx
type Booking = {
  id: string;
  customer: string;
  service: string;
  staff: string;
  time: string;
  status: "Pending" | "Confirmed" | "Done" | "Canceled";
  amount: number;
};

const stats = [
  { label: "Doanh thu hôm nay", value: "₫12,400,000", sub: "+8.2% so với hôm qua" },
  { label: "Lịch hẹn hôm nay", value: "14", sub: "3 đang chờ xác nhận" },
  { label: "Khách hàng mới", value: "6", sub: "Trong 24 giờ qua" },
  { label: "Tỉ lệ lấp lịch", value: "78%", sub: "Tuần này" },
];

const bookings: Booking[] = [
  { id: "BK-1021", customer: "Nguyễn Thu A", service: "Massage body 60'", staff: "Hà", time: "09:15", status: "Confirmed", amount: 450000 },
  { id: "BK-1022", customer: "Trần Văn B", service: "Chăm sóc da", staff: "Linh", time: "10:00", status: "Pending", amount: 650000 },
  { id: "BK-1023", customer: "Lê Thị C", service: "Gội đầu dưỡng sinh", staff: "My", time: "11:30", status: "Done", amount: 250000 },
  { id: "BK-1024", customer: "Phạm Minh D", service: "Triệt lông", staff: "Vy", time: "13:45", status: "Canceled", amount: 0 },
  { id: "BK-1025", customer: "Đỗ Anh E", service: "Massage đá nóng", staff: "Hà", time: "15:00", status: "Confirmed", amount: 550000 },
];

const topServices = [
  { name: "Massage body 60'", count: 42, revenue: 18900000 },
  { name: "Chăm sóc da", count: 31, revenue: 24100000 },
  { name: "Gội đầu dưỡng sinh", count: 28, revenue: 7700000 },
  { name: "Triệt lông", count: 19, revenue: 20500000 },
];

function StatusPill({ status }: { status: Booking["status"] }) {
  const map: Record<Booking["status"], string> = {
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    Done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Canceled: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${map[status]}`}>
      {status}
    </span>
  );
}

function Sparkline({ points }: { points: number[] }) {
  // SVG sparkline mini chart (không cần thư viện)
  const w = 120, h = 36, pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = (v: number) => {
    if (max === min) return h / 2;
    return pad + (h - pad * 2) * (1 - (v - min) / (max - min));
  };
  const step = (w - pad * 2) / (points.length - 1);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * step} ${norm(v)}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-900/80" />
    </svg>
  );
}

export default function Dashboard() {
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Tổng quan hoạt động • {today}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Online
          </button>
          <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            + Tạo lịch hẹn
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, idx) => (
          <div key={idx} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-600">{s.label}</div>
                <div className="mt-1 text-2xl font-semibold">{s.value}</div>
                <div className="mt-1 text-xs text-slate-500">{s.sub}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                {/* icon block */}
                <div className="h-8 w-8 grid place-items-center font-semibold">{idx + 1}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">7 ngày</div>
              <Sparkline points={[10, 14, 12, 18, 16, 19, 22].map((v) => v + idx * 2)} />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent bookings */}
        <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <div>
              <div className="text-sm font-semibold">Lịch hẹn gần đây</div>
              <div className="text-xs text-slate-600">Cập nhật theo thời gian thực (demo)</div>
            </div>
            <button className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">
              Xem tất cả
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr className="border-b">
                  <th className="px-4 py-3 font-medium">Mã</th>
                  <th className="px-4 py-3 font-medium">Khách</th>
                  <th className="px-4 py-3 font-medium">Dịch vụ</th>
                  <th className="px-4 py-3 font-medium">NV</th>
                  <th className="px-4 py-3 font-medium">Giờ</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Tiền</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{b.id}</td>
                    <td className="px-4 py-3">{b.customer}</td>
                    <td className="px-4 py-3 text-slate-700">{b.service}</td>
                    <td className="px-4 py-3">{b.staff}</td>
                    <td className="px-4 py-3">{b.time}</td>
                    <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {b.amount ? b.amount.toLocaleString("vi-VN") + "₫" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Top services */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Top dịch vụ</div>
                <div className="text-xs text-slate-600">Theo doanh thu tháng (demo)</div>
              </div>
              <button className="text-sm underline text-slate-700 hover:text-slate-900">
                Chi tiết
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {topServices.map((s) => {
                const max = Math.max(...topServices.map((x) => x.revenue));
                const pct = Math.round((s.revenue / max) * 100);
                return (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-slate-600 tabular-nums">
                        {s.count} lượt • {s.revenue.toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Thao tác nhanh</div>
            <div className="text-xs text-slate-600 mt-1">Các công việc hay dùng</div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="rounded-2xl border bg-white p-3 text-left hover:bg-slate-50">
                <div className="text-sm font-medium">Thêm khách hàng</div>
                <div className="text-xs text-slate-600 mt-1">Tạo hồ sơ mới</div>
              </button>
              <button className="rounded-2xl border bg-white p-3 text-left hover:bg-slate-50">
                <div className="text-sm font-medium">Tạo hóa đơn</div>
                <div className="text-xs text-slate-600 mt-1">Thanh toán nhanh</div>
              </button>
              <button className="rounded-2xl border bg-white p-3 text-left hover:bg-slate-50">
                <div className="text-sm font-medium">Quản lý dịch vụ</div>
                <div className="text-xs text-slate-600 mt-1">Giá / combo</div>
              </button>
              <button className="rounded-2xl border bg-white p-3 text-left hover:bg-slate-50">
                <div className="text-sm font-medium">Nhân viên</div>
                <div className="text-xs text-slate-600 mt-1">Ca làm / quyền</div>
              </button>
            </div>
          </div>

          {/* Notice */}
          <div className="rounded-2xl border bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white shadow-sm">
            <div className="text-sm font-semibold">Mẹo vận hành</div>
            <div className="text-xs text-white/80 mt-1">
              Bật xác nhận lịch hẹn tự động để giảm “Pending”.
            </div>
            <button className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
              Mở cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
