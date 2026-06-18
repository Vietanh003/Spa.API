import { useEffect, useMemo, useState, type FormEvent } from "react";
import { dmApi, type DanhMucDichVu } from "../api/danhMucDichVu";
type Mode = "create" | "edit";

function cn(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {active ? "Đang hoạt động" : "Ngừng"}
    </span>
  );
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
      <div className="relative w-full max-w-lg rounded-2xl border bg-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-semibold">{title}</div>
          <button className="rounded-lg px-2 py-1 text-sm hover:bg-slate-100" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function DanhMucDichVuPage() {
  const [rows, setRows] = useState<DanhMucDichVu[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  // form
  const [maDanhMuc, setMaDanhMuc] = useState("");
  const [tenDanhMuc, setTenDanhMuc] = useState("");
  const [moTa, setMoTa] = useState("");
  const [thuTu, setThuTu] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await dmApi.list();
      setRows(data);
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const view = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows
      .filter((x) => {
        if (filter === "active" && !x.isActive) return false;
        if (filter === "inactive" && x.isActive) return false;
        if (!kw) return true;
        return (
          x.maDanhMuc.toLowerCase().includes(kw) ||
          x.tenDanhMuc.toLowerCase().includes(kw) ||
          (x.moTa ?? "").toLowerCase().includes(kw)
        );
      })
      .sort((a, b) => (a.thuTu ?? 999999) - (b.thuTu ?? 999999));
  }, [rows, q, filter]);

  function resetForm() {
    setMaDanhMuc("");
    setTenDanhMuc("");
    setMoTa("");
    setThuTu("");
    setIsActive(true);
    setEditingId(null);
    setErr(null);
  }

  function openCreate() {
    resetForm();
    setMode("create");
    setOpen(true);
  }

  function openEdit(r: DanhMucDichVu) {
    setMode("edit");
    setEditingId(r.id);
    setMaDanhMuc(r.maDanhMuc);
    setTenDanhMuc(r.tenDanhMuc);
    setMoTa(r.moTa ?? "");
    setThuTu(r.thuTu == null ? "" : String(r.thuTu));
    setIsActive(r.isActive);
    setOpen(true);
    setErr(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    const thuTuNum = thuTu.trim() === "" ? null : Number(thuTu);
    if (thuTuNum !== null && Number.isNaN(thuTuNum)) {
      setErr("Thứ tự phải là số.");
      return;
    }

    try {
      if (mode === "create") {
        await dmApi.create({
          maDanhMuc: maDanhMuc,
          tenDanhMuc,
          moTa: moTa || null,
          thuTu: thuTuNum,
          isActive,
        });
        setToast("Đã tạo danh mục");
      } else {
        if (!editingId) return;
        await dmApi.update(editingId, {
          tenDanhMuc,
          moTa: moTa || null,
          thuTu: thuTuNum,
          isActive,
        });
        setToast("Đã cập nhật danh mục");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? "Lưu thất bại");
    }
  }

  async function toggleActive(r: DanhMucDichVu) {
    try {
      await dmApi.update(r.id, {
        tenDanhMuc: r.tenDanhMuc,
        moTa: r.moTa,
        thuTu: r.thuTu,
        isActive: !r.isActive,
      });
      await load();
    } catch (e: any) {
      alert(String(e?.response?.data ?? "Không cập nhật được trạng thái"));
    }
  }

  async function onDelete(r: DanhMucDichVu) {
    const ok = confirm(`Tắt (xóa mềm) danh mục "${r.tenDanhMuc}"?`);
    if (!ok) return;

    try {
      await dmApi.remove(r.id);
      setToast("Đã tắt danh mục");
      await load();
    } catch (e: any) {
      alert(String(e?.response?.data ?? "Không xóa được"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Danh mục dịch vụ</h1>
          <p className="text-sm text-slate-600 mt-1">Quản lý danh mục dùng cho dịch vụ trong spa</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreate}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Thêm danh mục
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button
              className={cn("rounded-xl border px-3 py-2 text-sm", filter === "all" && "bg-slate-900 text-white border-slate-900")}
              onClick={() => setFilter("all")}
            >
              Tất cả
            </button>
            <button
              className={cn("rounded-xl border px-3 py-2 text-sm", filter === "active" && "bg-slate-900 text-white border-slate-900")}
              onClick={() => setFilter("active")}
            >
              Đang hoạt động
            </button>
            <button
              className={cn("rounded-xl border px-3 py-2 text-sm", filter === "inactive" && "bg-slate-900 text-white border-slate-900")}
              onClick={() => setFilter("inactive")}
            >
              Ngừng
            </button>
          </div>

          <input
            className="w-full md:w-80 rounded-xl border px-3 py-2 text-sm"
            placeholder="Tìm theo mã / tên / mô tả..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {String(err)}
          </div>
        )}
      </div>

      {/* table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
          <div className="text-sm font-semibold">Danh sách</div>
          <button onClick={load} className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">
            Reload
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr className="border-b">
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Tên danh mục</th>
                <th className="px-4 py-3 font-medium">Mô tả</th>
                <th className="px-4 py-3 font-medium">Thứ tự</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>Đang tải...</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>Không có dữ liệu</td></tr>
              ) : (
                view.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.maDanhMuc}</td>
                    <td className="px-4 py-3">{r.tenDanhMuc}</td>
                    <td className="px-4 py-3 text-slate-700">{r.moTa ?? "—"}</td>
                    <td className="px-4 py-3">{r.thuTu ?? "—"}</td>
                    <td className="px-4 py-3"><Badge active={r.isActive} /></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => toggleActive(r)}
                        className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        {r.isActive ? "Tắt" : "Bật"}
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

      {/* modal */}
      <Modal
        open={open}
        title={mode === "create" ? "Thêm danh mục" : "Cập nhật danh mục"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSave} className="space-y-3">
          {mode === "create" && (
            <label className="block text-sm">
              Mã danh mục
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={maDanhMuc}
                onChange={(e) => setMaDanhMuc(e.target.value)}
                placeholder="VD: MASSAGE"
              />
            </label>
          )}

          <label className="block text-sm">
            Tên danh mục
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={tenDanhMuc}
              onChange={(e) => setTenDanhMuc(e.target.value)}
              placeholder="VD: Massage"
            />
          </label>

          <label className="block text-sm">
            Mô tả
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2"
              rows={3}
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              placeholder="Mô tả ngắn..."
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-sm">
              Thứ tự
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={thuTu}
                onChange={(e) => setThuTu(e.target.value)}
                placeholder="VD: 1"
              />
            </label>

            <label className="flex items-center gap-2 text-sm mt-6 md:mt-0">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Đang hoạt động
            </label>
          </div>

          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {String(err)}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">
              Hủy
            </button>
            <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <div
          className="fixed bottom-4 right-4 rounded-2xl border bg-white px-4 py-3 shadow-lg text-sm"
          onAnimationEnd={() => setToast(null)}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
