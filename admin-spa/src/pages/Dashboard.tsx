import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarDays,
  MessageSquare,
  Newspaper,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { dashboardApi, type DashboardStats } from "../api/dashboard";

function getErrorText(e: unknown, fallback: string) {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const maybe = e as { message?: unknown; response?: { data?: unknown } };
    const data = maybe.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      try { return JSON.stringify(data); } catch { return String(data); }
    }
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

function formatVnd(n: number) {
  if (!Number.isFinite(n)) return "0₫";
  return n.toLocaleString("vi-VN") + "₫";
}

function formatTime(t: string | undefined) {
  if (!t) return "—";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function statusMeta(value?: string) {
  const s = String(value ?? "").trim();
  if (s === "Đã xác nhận") return { label: "Đã xác nhận", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (s === "Hủy") return { label: "Đã hủy", className: "bg-rose-50 text-rose-700 ring-rose-200" };
  if (s === "Hoàn thành") return { label: "Hoàn thành", className: "bg-slate-100 text-slate-700 ring-slate-200" };
  return { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 ring-amber-200" };
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 120, h = 36, pad = 4;
  if (!points || points.length === 0) {
    return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = (v: number) => {
    if (max === min) return h / 2;
    return pad + (h - pad * 2) * (1 - (v - min) / (max - min));
  };
  const step = points.length === 1 ? 0 : (w - pad * 2) / (points.length - 1);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * step} ${norm(v)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={`block ${className ?? ""}`}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-900/70" />
      <circle cx={pad + (points.length - 1) * step} cy={norm(last)} r="2.5" className="fill-slate-900" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  spark?: number[];
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
        </div>
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div>
      </div>
      {spark && (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">7 ngày</div>
          <Sparkline points={spark} />
        </div>
      )}
    </div>
  );
}

function pctText(p: number | null) {
  if (p == null) return "—";
  const v = Math.round(p * 10) / 10;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v}% so với hôm qua`;
}

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await dashboardApi.stats();
      setData(d);
    } catch (e: unknown) {
      setErr(getErrorText(e, "Không tải được dữ liệu dashboard"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Tổng quan hoạt động • {today}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <button
            onClick={() => nav("/admin/lich-hen")}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Quản lý lịch hẹn
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {String(err)}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doanh thu hôm nay"
          value={data ? formatVnd(data.today.revenue) : "—"}
          sub={data ? pctText(data.today.revenueChangePct) : "Đang tải..."}
          icon={<Wallet size={18} />}
          spark={data?.weekly.revenue}
        />
        <StatCard
          label="Lịch hẹn hôm nay"
          value={data ? String(data.today.bookings) : "—"}
          sub={
            data
              ? `${data.today.pending} chờ xác nhận · ${data.today.confirmed} đã xác nhận`
              : "Đang tải..."
          }
          icon={<CalendarDays size={18} />}
          spark={data?.weekly.bookings}
        />
        <StatCard
          label="Tin liên hệ mới"
          value={data ? String(data.today.newContacts24h) : "—"}
          sub={
            data
              ? `${data.totals.unreadContacts} chưa đọc tổng`
              : "Trong 24 giờ"
          }
          icon={<MessageSquare size={18} />}
        />
        <StatCard
          label="Doanh thu tháng này"
          value={data ? formatVnd(data.month.revenue) : "—"}
          sub={data ? `${data.month.bookings} lịch hẹn / tháng` : "Đang tải..."}
          icon={<Wallet size={18} />}
        />
      </div>

      {/* Mini totals */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat
          label="Dịch vụ đang bán"
          value={data?.totals.activeServices ?? 0}
          icon={<Briefcase size={16} />}
          to="/admin/dich-vu"
        />
        <MiniStat
          label="Lịch chờ xác nhận"
          value={data?.totals.pendingBookings ?? 0}
          icon={<CalendarDays size={16} />}
          to="/admin/lich-hen"
          highlight={Boolean(data && data.totals.pendingBookings > 0)}
        />
        <MiniStat
          label="Liên hệ chưa đọc"
          value={data?.totals.unreadContacts ?? 0}
          icon={<MessageSquare size={16} />}
          to="/admin/lien-he"
          highlight={Boolean(data && data.totals.unreadContacts > 0)}
        />
        <MiniStat
          label="Bài blog đã xuất bản"
          value={data?.totals.publishedPosts ?? 0}
          icon={<Newspaper size={16} />}
          to="/admin/blog"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent bookings */}
        <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <div>
              <div className="text-sm font-semibold">Lịch hẹn gần đây</div>
              <div className="text-xs text-slate-600">10 lịch hẹn được tạo gần nhất</div>
            </div>
            <Link to="/admin/lich-hen" className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">
              Xem tất cả
            </Link>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr className="border-b">
                  <th className="px-4 py-3 font-medium">Khách</th>
                  <th className="px-4 py-3 font-medium">Dịch vụ</th>
                  <th className="px-4 py-3 font-medium">Ngày / giờ</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Giá</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td className="px-4 py-6 text-slate-500" colSpan={5}>Đang tải...</td></tr>
                ) : (data?.recentBookings.length ?? 0) === 0 ? (
                  <tr><td className="px-4 py-6 text-slate-500" colSpan={5}>Chưa có lịch hẹn</td></tr>
                ) : (
                  data!.recentBookings.map((b) => {
                    const m = statusMeta(b.trangThai);
                    return (
                      <tr key={b.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{b.hoTenKhach}</div>
                          <div className="text-xs text-slate-500">{b.dienThoaiKhach}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{b.tenDichVu ?? `#${b.dichVuId}`}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <div>{formatDate(b.ngayHen)}</div>
                          <div className="text-xs text-slate-500">{formatTime(b.gioHen)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${m.className}`}>
                            {m.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {b.gia > 0 ? formatVnd(b.gia) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
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
                <div className="text-sm font-semibold">Top dịch vụ tháng này</div>
                <div className="text-xs text-slate-600">Theo doanh thu từ lịch hoàn thành</div>
              </div>
              <Link to="/admin/dich-vu" className="text-sm underline text-slate-700 hover:text-slate-900">Chi tiết</Link>
            </div>

            <div className="mt-4 space-y-3">
              {loading && !data ? (
                <div className="text-sm text-slate-500">Đang tải...</div>
              ) : (data?.topServices.length ?? 0) === 0 ? (
                <div className="text-sm text-slate-500">Chưa có dữ liệu tháng này.</div>
              ) : (
                (() => {
                  const max = Math.max(...(data!.topServices.map((x) => x.revenue)), 1);
                  return data!.topServices.map((s) => {
                    const pct = Math.round((s.revenue / max) * 100);
                    return (
                      <div key={s.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium truncate">{s.tenDichVu}</div>
                          <div className="text-xs text-slate-600 tabular-nums whitespace-nowrap">
                            {s.count} lượt · {formatVnd(s.revenue)}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          {/* Weekly chart */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Hoạt động 7 ngày</div>
            <div className="text-xs text-slate-600 mt-1">Doanh thu & số lịch hẹn theo ngày</div>

            <div className="mt-3 space-y-3">
              <SeriesRow
                title="Doanh thu"
                values={data?.weekly.revenue ?? []}
                labels={data?.weekly.labels ?? []}
                formatValue={(v) => formatVnd(v)}
              />
              <SeriesRow
                title="Lịch hẹn"
                values={data?.weekly.bookings ?? []}
                labels={data?.weekly.labels ?? []}
                formatValue={(v) => String(v)}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Thao tác nhanh</div>
            <div className="text-xs text-slate-600 mt-1">Các công việc hay dùng</div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <QuickAction to="/admin/lich-hen" title="Lịch hẹn" desc="Xác nhận / lọc" icon={<CalendarDays size={16} />} />
              <QuickAction to="/admin/dich-vu" title="Dịch vụ" desc="Giá / hình ảnh" icon={<Briefcase size={16} />} />
              <QuickAction to="/admin/lien-he" title="Tin liên hệ" desc="Phản hồi khách" icon={<MessageSquare size={16} />} />
              <QuickAction to="/admin/blog" title="Blog" desc="Đăng bài mới" icon={<Newspaper size={16} />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label, value, icon, to, highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  to: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm transition hover:bg-slate-50 ${highlight ? "ring-1 ring-amber-300" : ""}`}
    >
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${highlight ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
      </div>
    </Link>
  );
}

function QuickAction({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="rounded-2xl border bg-white p-3 hover:bg-slate-50">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-700">{icon}</span>
        {title}
      </div>
      <div className="mt-1 text-xs text-slate-600">{desc}</div>
    </Link>
  );
}

function SeriesRow({
  title, values, labels, formatValue,
}: {
  title: string;
  values: number[];
  labels: string[];
  formatValue: (v: number) => string;
}) {
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-700">{title}</div>
        <div className="text-xs text-slate-500">Tổng: {formatValue(total)}</div>
      </div>
      <div className="mt-2 flex h-20 items-end gap-1.5">
        {values.length === 0 ? (
          <div className="flex-1 text-xs text-slate-400">Chưa có dữ liệu</div>
        ) : (
          values.map((v, i) => {
            const pct = Math.round((v / max) * 100);
            const label = labels[i] ? labels[i].slice(5) : "";
            const isToday = i === values.length - 1;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full" style={{ height: `${Math.max(pct, 4)}%` }} title={`${label}: ${formatValue(v)}`}>
                  <div className={`absolute inset-x-0 bottom-0 h-full rounded-md ${isToday ? "bg-slate-900" : "bg-slate-300"}`} />
                </div>
                <div className={`text-[10px] ${isToday ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                  {label.replace("-", "/")}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
