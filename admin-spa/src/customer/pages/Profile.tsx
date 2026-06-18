import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CalendarClock, Clock, LogOut, Mail, RefreshCw } from "lucide-react";
import { lichHenApi, type CustomerBookingRow } from "../../api/lichHen";
import { useCustomerAuthStore } from "../store/auth";

function getErrorText(e: unknown, fallback: string) {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const maybe = e as { message?: unknown; response?: { data?: unknown } };
    const data = maybe.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") return JSON.stringify(data);
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

function formatTime(value: string) {
  return value?.length >= 5 ? value.slice(0, 5) : value;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function isCancelled(status: string) {
  const s = status.toLowerCase();
  return s.includes("huy") || s.includes("hủy");
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("xác nhận") || s.includes("xac nhan")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (isCancelled(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  if (s.includes("hoàn") || s.includes("hoan") || s.includes("đã đến") || s.includes("da den")) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function initials(value?: string | null) {
  const text = (value ?? "").trim();
  if (!text) return "KH";
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

export default function CustomerProfile() {
  const user = useCustomerAuthStore((s) => s.user);
  const logout = useCustomerAuthStore((s) => s.logout);
  const [rows, setRows] = useState<CustomerBookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rows.filter((x) => x.ngayHen >= today && !isCancelled(x.trangThai));
  }, [rows]);

  const completed = useMemo(() => rows.filter((x) => x.daDen).length, [rows]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await lichHenApi.my();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(getErrorText(e, "Khong tai duoc lich hen cua ban."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  if (!user) return <Navigate to="/customer-login" replace />;

  return (
    <div className="bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-amber-700 text-white">
                {initials(user.fullName || user.email)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-stone-900">{user.fullName || "Khach hang"}</h1>
                <div className="mt-1 flex min-w-0 items-center gap-2 text-sm text-stone-500">
                  <Mail size={15} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              <LogOut size={16} />
              Dang xuat
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-stone-50 px-4 py-3">
              <div className="text-xs font-semibold text-stone-500">Tat ca</div>
              <div className="mt-1 text-2xl font-semibold text-stone-900">{rows.length}</div>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3">
              <div className="text-xs font-semibold text-amber-700">Sap toi</div>
              <div className="mt-1 text-2xl font-semibold text-stone-900">{upcoming.length}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <div className="text-xs font-semibold text-emerald-700">Da den</div>
              <div className="mt-1 text-2xl font-semibold text-stone-900">{completed}</div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl tracking-tight text-stone-800 md:text-4xl">Lich su lich hen</h2>
            <p className="mt-2 text-sm text-stone-500">Theo doi lich da dat va trang thai xac nhan cua spa.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Tai lai
            </button>
            <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
              <CalendarClock size={16} />
              Dat lich
            </Link>
          </div>
        </div>

        {err && <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>}

        <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {loading && rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-stone-500">Dang tai lich hen...</div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-sm font-semibold text-stone-800">Ban chua co lich hen nao.</div>
              <Link to="/booking" className="mt-3 inline-flex rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
                Dat lich ngay
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {rows.map((row) => (
                <article key={row.id} className="grid gap-4 px-5 py-5 md:grid-cols-[160px_1fr_auto] md:items-center">
                  <div>
                    <div className="text-lg font-semibold text-stone-900">{formatDate(row.ngayHen)}</div>
                    <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-500">
                      <Clock size={15} />
                      {formatTime(row.gioHen)}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-stone-900">{row.tenDichVu ?? `Dich vu #${row.dichVuId}`}</div>
                    <div className="mt-1 text-sm text-stone-500">
                      {row.thoiLuongDuKien} phut - {row.dienThoaiKhach}
                    </div>
                    {row.ghiChuKhach && <div className="mt-2 text-sm text-stone-600">Ghi chu: {row.ghiChuKhach}</div>}
                    {row.lyDoHuy && <div className="mt-2 text-sm text-rose-600">Ly do huy: {row.lyDoHuy}</div>}
                  </div>

                  <div className="md:text-right">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(row.trangThai)}`}>
                      {row.trangThai}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
