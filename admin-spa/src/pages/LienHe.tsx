import { useEffect, useMemo, useState } from "react";
import { lienHeApi, type LienHeRow } from "../api/lienHe";

function cn(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function getErrorText(e: unknown, fallback: string) {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const maybe = e as { message?: unknown; response?: { data?: unknown } };
    const data = maybe.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      try {
        return JSON.stringify(data);
      } catch {
        return String(data);
      }
    }
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

function formatDateTime(v: string | null | undefined) {
  if (!v) return "—";
  const dt = new Date(v);
  if (!Number.isFinite(dt.getTime())) return String(v);
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(dt);
  } catch {
    return String(v);
  }
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border bg-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-semibold">{title}</div>
          <button className="rounded-lg px-2 py-1 text-sm hover:bg-slate-100" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export default function LienHeAdminPage() {
  const [rows, setRows] = useState<LienHeRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // modal
  const [selected, setSelected] = useState<LienHeRow | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params: { q?: string; unread?: boolean } = {};
      const kw = q.trim();
      if (kw) params.q = kw;
      if (filter === "unread") params.unread = true;
      if (filter === "read") params.unread = false;
      const res = await lienHeApi.list(params);
      setRows(res.items);
      setUnreadCount(res.unreadCount);
    } catch (e: unknown) {
      setErr(getErrorText(e, "Không tải được danh sách"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = useMemo(() => rows, [rows]);

  async function openDetail(row: LienHeRow) {
    setSelected(row);
    if (!row.daXem) {
      try {
        await lienHeApi.markRead(row.id, true);
        setRows((prev) =>
          prev.map((x) => (x.id === row.id ? { ...x, daXem: true, xemLuc: new Date().toISOString() } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // bỏ qua, không chặn UI
      }
    }
  }

  async function toggleRead(row: LienHeRow) {
    try {
      const next = !row.daXem;
      await lienHeApi.markRead(row.id, next);
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                daXem: next,
                xemLuc: next ? new Date().toISOString() : null,
                xemBoi: next ? x.xemBoi : null,
              }
            : x
        )
      );
      setUnreadCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    } catch (e: unknown) {
      alert(getErrorText(e, "Cập nhật thất bại"));
    }
  }

  async function onDelete(row: LienHeRow) {
    if (!confirm(`Xóa tin nhắn của "${row.hoTen}"?`)) return;
    try {
      await lienHeApi.remove(row.id);
      setRows((prev) => prev.filter((x) => x.id !== row.id));
      if (!row.daXem) setUnreadCount((c) => Math.max(0, c - 1));
      if (selected?.id === row.id) setSelected(null);
    } catch (e: unknown) {
      alert(getErrorText(e, "Xóa thất bại"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tin nhắn liên hệ</h1>
          <p className="text-sm text-slate-600 mt-1">
            Khách hàng gửi qua trang Liên hệ. Chưa đọc:{" "}
            <span className="font-semibold text-rose-600">{unreadCount}</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-xl border px-3 py-2 text-sm md:col-span-2"
            placeholder="Tìm theo tên / SĐT / email / nội dung..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />

          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "unread" | "read")}
          >
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>

          <button onClick={load} className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">
            Áp dụng lọc
          </button>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {String(err)}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
          <div className="text-sm font-semibold">Danh sách tin nhắn</div>
          <div className="text-xs text-slate-500">Tổng: {view.length}</div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr className="border-b">
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Khách</th>
                <th className="px-4 py-3 font-medium">Liên hệ</th>
                <th className="px-4 py-3 font-medium">Trích nội dung</th>
                <th className="px-4 py-3 font-medium">Gửi lúc</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Đang tải...
                  </td>
                </tr>
              ) : view.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Không có tin nhắn
                  </td>
                </tr>
              ) : (
                view.map((r) => (
                  <tr key={r.id} className={cn("border-b last:border-b-0 hover:bg-slate-50", !r.daXem && "bg-amber-50/40")}>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          r.daXem
                            ? "bg-slate-100 text-slate-700 ring-slate-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        )}
                      >
                        {r.daXem ? "Đã đọc" : "Chưa đọc"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.hoTen}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>
                        <a className="hover:underline" href={`tel:${r.dienThoai}`}>
                          {r.dienThoai}
                        </a>
                      </div>
                      {r.email && (
                        <div className="text-xs text-slate-500">
                          <a className="hover:underline" href={`mailto:${r.email}`}>
                            {r.email}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-700" title={r.loiNhan}>
                      {r.loiNhan}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openDetail(r)}
                        className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => toggleRead(r)}
                        className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        {r.daXem ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                      </button>
                      <button
                        onClick={() => onDelete(r)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} title="Chi tiết tin nhắn" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-slate-500">Họ tên</div>
                <div className="font-semibold">{selected.hoTen}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Số điện thoại</div>
                <div className="font-semibold">
                  <a className="hover:underline" href={`tel:${selected.dienThoai}`}>
                    {selected.dienThoai}
                  </a>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Email</div>
                <div className="font-semibold">
                  {selected.email ? (
                    <a className="hover:underline" href={`mailto:${selected.email}`}>
                      {selected.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Gửi lúc</div>
                <div className="font-semibold">{formatDateTime(selected.createdAt)}</div>
              </div>
              {selected.daXem && (
                <div className="md:col-span-2">
                  <div className="text-xs text-slate-500">Đã xem</div>
                  <div className="font-semibold">
                    {formatDateTime(selected.xemLuc)}
                    {selected.xemBoi ? ` · bởi ${selected.xemBoi}` : ""}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-slate-500">Lời nhắn</div>
              <div className="mt-1 whitespace-pre-wrap rounded-xl border bg-slate-50 p-3 leading-6 text-slate-800">
                {selected.loiNhan}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={`tel:${selected.dienThoai}`}
                className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                Gọi
              </a>
              {selected.email && (
                <a
                  href={`mailto:${selected.email}`}
                  className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Gửi email
                </a>
              )}
              <button
                onClick={() => toggleRead(selected)}
                className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                {selected.daXem ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
