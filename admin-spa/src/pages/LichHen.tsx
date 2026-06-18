import { useEffect, useMemo, useState } from "react";
import { lichHenApi } from "../api/lichHen";
import { useAuthStore } from "../store/auth";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "-";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

// Backend lưu trangThai bằng chuỗi tiếng Việt: "Chờ xác nhận" | "Đã xác nhận" | "Hủy" | "Hoàn thành"
function normalizeStatus(value?: string) {
  return String(value ?? "").trim();
}

const STATUS_PENDING = "Chờ xác nhận";
const STATUS_CONFIRMED = "Đã xác nhận";
const STATUS_CANCELLED = "Hủy";
const STATUS_DONE = "Hoàn thành";

function statusMeta(value?: string) {
  const status = normalizeStatus(value);
  if (status === STATUS_CONFIRMED) {
    return { label: "Đã xác nhận", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  }
  if (status === STATUS_CANCELLED) {
    return { label: "Đã hủy", className: "bg-rose-50 text-rose-700 ring-rose-200" };
  }
  if (status === STATUS_DONE) {
    return { label: "Hoàn thành", className: "bg-slate-100 text-slate-700 ring-slate-200" };
  }
  return { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 ring-amber-200" };
}

export default function LichHenPage() {
  const [from, setFrom] = useState<string>(isoDate(new Date()));
  const [to, setTo] = useState<string>(isoDate(new Date(Date.now() + 7 * 24 * 3600 * 1000)));
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [nhanVienIdInput, setNhanVienIdInput] = useState<string>("");
  const [ghiChuNoiBoInput, setGhiChuNoiBoInput] = useState<string>("Đã gọi xác nhận, khách sẽ đến đúng giờ");

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.id && !nhanVienIdInput) {
      setNhanVienIdInput(String(user.id));
    }
  }, [user, nhanVienIdInput]);

  function fetchList() {
    setLoading(true);
    setErr(null);
    lichHenApi
      .list({ from, to, status })
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e: any) => setErr(e?.response?.data ?? e?.message ?? "Không thể tải lịch"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const normalized = items.map((it) => normalizeStatus(it?.trangThai));
    return {
      total: items.length,
      pending: normalized.filter((x) => !x || x === STATUS_PENDING).length,
      confirmed: normalized.filter((x) => x === STATUS_CONFIRMED).length,
      done: normalized.filter((x) => x === STATUS_DONE).length,
      cancelled: normalized.filter((x) => x === STATUS_CANCELLED).length,
    };
  }, [items]);

  function onConfirm(id: number) {
    // open modal-based confirm
    const it = items.find((x) => x.id === id) ?? null;
    setSelected(it);
    setNhanVienIdInput(user ? String(user.id) : "");
    setGhiChuNoiBoInput("Đã gọi xác nhận, khách sẽ đến đúng giờ");
    setConfirming(true);
  }

  function doConfirm() {
    if (!selected) return;
    if (normalizeStatus(selected.trangThai) === STATUS_CONFIRMED) {
      alert("Lịch hẹn này đã được xác nhận trước đó.");
      return;
    }
    const trimmedId = nhanVienIdInput.trim();
    const nid = trimmedId === "" ? undefined : Number(trimmedId);
    if (nid !== undefined && (!Number.isFinite(nid) || nid <= 0)) {
      alert("Mã nhân viên phải là số nguyên dương (hoặc bỏ trống).");
      return;
    }
    setConfirming(true);
    lichHenApi
      .confirm(selected.id, { nhanVienId: nid, ghiChuNoiBo: ghiChuNoiBoInput })
      .then(() => {
        setSelected(null);
        fetchList();
      })
      .catch((e: any) => alert(e?.response?.data ?? e?.message ?? "Xác nhận thất bại"))
      .finally(() => setConfirming(false));
  }

  function doComplete(it: any) {
    if (normalizeStatus(it?.trangThai) !== STATUS_CONFIRMED) {
      alert("Chỉ lịch hẹn đã xác nhận mới được cập nhật Hoàn thành.");
      return;
    }
    if (!window.confirm("Cập nhật lịch hẹn này thành Hoàn thành?")) return;
    setLoading(true);
    lichHenApi
      .complete(it.id)
      .then(() => {
        setSelected(null);
        fetchList();
      })
      .catch((e: any) => alert(e?.response?.data ?? e?.message ?? "Cập nhật trạng thái thất bại"))
      .finally(() => setLoading(false));
  }

  function openDetails(it: any) {
    setSelected(it);
    setConfirming(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lịch hẹn</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Chi tiết lịch hẹn</h1>
          <p className="mt-1 text-sm text-slate-600">Theo dõi danh sách, mở chi tiết và xác nhận lịch hẹn trong cùng một màn hình.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Tổng: {stats.total}</div>
          <div className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">Chờ: {stats.pending}</div>
          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Xác nhận: {stats.confirmed}</div>
          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Hoàn thành: {stats.done}</div>
          <div className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-700">Hủy: {stats.cancelled}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_220px_auto]">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Từ ngày</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Đến ngày</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Trạng thái</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              value={status ?? ""}
              onChange={(e) => setStatus(e.target.value || undefined)}
            >
              <option value="">Tất cả</option>
              <option value={STATUS_PENDING}>{STATUS_PENDING}</option>
              <option value={STATUS_CONFIRMED}>{STATUS_CONFIRMED}</option>
              <option value={STATUS_CANCELLED}>Đã hủy</option>
              <option value={STATUS_DONE}>{STATUS_DONE}</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={fetchList}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Lọc lịch"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading && <div>Đang tải...</div>}
        {err && <div className="text-rose-600">{err}</div>}

        {(!loading && !err && items.length === 0) && (
          <div className="px-6 py-12 text-center">
            <div className="text-sm font-medium text-slate-900">Không có lịch hẹn phù hợp</div>
            <div className="mt-1 text-sm text-slate-500">Hãy đổi khoảng ngày hoặc trạng thái để xem dữ liệu khác.</div>
          </div>
        )}

        {items.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Khách</th>
                  <th className="px-4 py-3 font-medium">Dịch vụ</th>
                  <th className="px-4 py-3 font-medium">Ngày / giờ</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const meta = statusMeta(it.trangThai);
                  const normalizedStatus = normalizeStatus(it.trangThai);
                  const canConfirm = normalizedStatus === STATUS_PENDING || !normalizedStatus;
                  const canComplete = normalizedStatus === STATUS_CONFIRMED;

                  return (
                    <tr key={it.id} className="cursor-pointer border-t transition hover:bg-slate-50/80" onClick={() => openDetails(it)}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{it.hoTenKhach}</div>
                        <div className="text-xs text-slate-500">{it.dienThoaiKhach} {it.emailKhach ? `• ${it.emailKhach}` : ""}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{it.tenDichVu ?? `#${it.dichVuId}`}</td>
                      <td className="px-4 py-4 text-slate-700">
                        <div>{formatDate(it.ngayHen)}</div>
                        <div className="text-xs text-slate-500">{formatTime(it.gioHen)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(it);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Xem chi tiết
                          </button>
                          {canConfirm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onConfirm(it.id);
                              }}
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
                            >
                              Xác nhận
                            </button>
                          )}
                          {canComplete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                doComplete(it);
                              }}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                            >
                              Hoàn thành
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details / Confirm Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-4 border-b bg-slate-50 px-6 py-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chi tiết lịch hẹn</div>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{selected.hoTenKhach}</h2>
                <div className="mt-1 text-sm text-slate-600">{selected.dienThoaiKhach} {selected.emailKhach ? `• ${selected.emailKhach}` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${statusMeta(selected.trangThai).className}`}>
                  {statusMeta(selected.trangThai).label}
                </span>
                <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100" onClick={() => setSelected(null)}>
                  Đóng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">Thông tin đặt lịch</div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoItem label="Dịch vụ" value={selected.tenDichVu ?? `#${selected.dichVuId}`} />
                    <InfoItem label="Ngày hẹn" value={formatDate(selected.ngayHen)} />
                    <InfoItem label="Giờ hẹn" value={formatTime(selected.gioHen)} />
                    <InfoItem label="Thời lượng" value={selected.thoiLuongDuKien ? `${selected.thoiLuongDuKien} phút` : "-"} />
                    <InfoItem label="Khách" value={selected.hoTenKhach} />
                    <InfoItem label="Điện thoại" value={selected.dienThoaiKhach} />
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">Ghi chú</div>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Ghi chú khách</div>
                      <div className="mt-1 text-sm text-slate-700">{selected.ghiChuKhach || "Không có ghi chú"}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Ghi chú nội bộ</div>
                      <div className="mt-1 text-sm text-slate-700">{selected.ghiChuNoiBo || "Chưa có ghi chú nội bộ"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Xác nhận lịch hẹn</div>
                  <div className="mt-1 text-xs text-slate-500">Điền mã nhân viên và ghi chú nội bộ trước khi xác nhận.</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Mã nhân viên</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      value={nhanVienIdInput}
                      onChange={(e) => setNhanVienIdInput(e.target.value)}
                      placeholder="ID nhân viên"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Ghi chú nội bộ</label>
                    <textarea
                      className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      value={ghiChuNoiBoInput}
                      onChange={(e) => setGhiChuNoiBoInput(e.target.value)}
                      placeholder="Ghi chú cho nội bộ"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={doConfirm}
                    disabled={loading || confirming || normalizeStatus(selected.trangThai) !== STATUS_PENDING}
                  >
                    {loading || confirming ? "Đang xác nhận..." : "Xác nhận"}
                  </button>
                  {normalizeStatus(selected.trangThai) === STATUS_CONFIRMED && (
                    <button
                      className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => doComplete(selected)}
                      disabled={loading || confirming}
                    >
                      {loading ? "Đang cập nhật..." : "Hoàn thành"}
                    </button>
                  )}
                  <button
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    onClick={() => setSelected(null)}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
