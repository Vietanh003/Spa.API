import { useEffect, useMemo, useState, type FormEvent } from "react";
import { dvApi, type DichVuRow, type DichVuDetail } from "../api/dichVu";
import { danhMucApi, type DanhMucOption } from "../api/danhMucDichVu";

type Mode = "create" | "edit";

function cn(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function Badge({ ok, onLabel, offLabel }: { ok: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        ok ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {ok ? onLabel : offLabel}
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
      <div className="relative w-full max-w-3xl rounded-2xl border bg-white shadow-lg">
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

export default function DichVuPage() {
  const [rows, setRows] = useState<DichVuRow[]>([]);
  const [cats, setCats] = useState<DanhMucOption[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [active, setActive] = useState<"all" | "true" | "false">("all");
  const [catId, setCatId] = useState<string>("");

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  // form (subset quan trọng)
  const [maDichVu, setMaDichVu] = useState("");
  const [tenDichVu, setTenDichVu] = useState("");
  const [danhMucId, setDanhMucId] = useState<string>("");
  const [giaHienTai, setGiaHienTai] = useState<string>("0");
  const [giaGoc, setGiaGoc] = useState<string>("");
  const [thoiLuongPhut, setThoiLuongPhut] = useState<string>("");
  const [thuTuHienThi, setThuTuHienThi] = useState<string>("");
  const [moTaNgan, setMoTaNgan] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isOnlineVisible, setIsOnlineVisible] = useState(true);
  const [isCombo, setIsCombo] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  async function loadCats() {
    const data = await danhMucApi.list();
    setCats(data);
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params: any = {};
      const kw = q.trim();
      if (kw) params.q = kw;
      if (active !== "all") params.active = active === "true";
      if (catId) params.danhMucId = Number(catId);
      const data = await dvApi.list(params);
      setRows(data);
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCats();
    load();
  }, []);

  const view = useMemo(() => rows, [rows]);

  function resetForm() {
    setMaDichVu("");
    setTenDichVu("");
    setDanhMucId("");
    setGiaHienTai("0");
    setGiaGoc("");
    setThoiLuongPhut("");
    setThuTuHienThi("");
    setMoTaNgan("");
    setIsActive(true);
    setIsOnlineVisible(true);
    setIsCombo(false);
    setEditingId(null);
    setErr(null);
  }

  function openCreate() {
    resetForm();
    setMode("create");
    setOpen(true);
  }

  async function openEdit(id: number) {
    setErr(null);
    setMode("edit");
    setEditingId(id);
    setOpen(true);

    try {
      const d: DichVuDetail = await dvApi.get(id);
      setMaDichVu(d.maDichVu);
      setTenDichVu(d.tenDichVu);
      setDanhMucId(d.danhMucId == null ? "" : String(d.danhMucId));
      setGiaHienTai(String(d.giaHienTai ?? 0));
      setGiaGoc(d.giaGoc == null ? "" : String(d.giaGoc));
      setThoiLuongPhut(d.thoiLuongPhut == null ? "" : String(d.thoiLuongPhut));
      setThuTuHienThi(d.thuTuHienThi == null ? "" : String(d.thuTuHienThi));
      setMoTaNgan(d.moTaNgan ?? "");
      setIsActive(!!d.isActive);
      setIsOnlineVisible(!!d.isOnlineVisible);
      setIsCombo(!!d.isCombo);
    } catch (e: any) {
      setErr(e?.response?.data ?? "Không tải được chi tiết");
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    const price = Number(giaHienTai);
    if (Number.isNaN(price) || price < 0) return setErr("Giá hiện tại không hợp lệ.");

    const giaGocNum = giaGoc.trim() === "" ? null : Number(giaGoc);
    if (giaGocNum !== null && (Number.isNaN(giaGocNum) || giaGocNum < 0)) return setErr("Giá gốc không hợp lệ.");

    const tlNum = thoiLuongPhut.trim() === "" ? null : Number(thoiLuongPhut);
    if (tlNum !== null && (Number.isNaN(tlNum) || tlNum < 0)) return setErr("Thời lượng không hợp lệ.");

    const ttNum = thuTuHienThi.trim() === "" ? null : Number(thuTuHienThi);
    if (ttNum !== null && Number.isNaN(ttNum)) return setErr("Thứ tự hiển thị không hợp lệ.");

    const dmNum = danhMucId.trim() === "" ? null : Number(danhMucId);
    if (dmNum !== null && Number.isNaN(dmNum)) return setErr("Danh mục không hợp lệ.");

    try {
      if (mode === "create") {
        await dvApi.create({
          danhMucId: dmNum,
          maDichVu,
          tenDichVu,
          moTaNgan: moTaNgan || null,
          giaHienTai: price,
          giaGoc: giaGocNum,
          thoiLuongPhut: tlNum,
          thuTuHienThi: ttNum,
          isActive,
          isOnlineVisible,
          isCombo,
        });
      } else {
        if (!editingId) return;
        await dvApi.update(editingId, {
          danhMucId: dmNum,
          tenDichVu,
          moTaNgan: moTaNgan || null,
          giaHienTai: price,
          giaGoc: giaGocNum,
          thoiLuongPhut: tlNum,
          thuTuHienThi: ttNum,
          isActive,
          isOnlineVisible,
          isCombo,
        });
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? "Lưu thất bại");
    }
  }

  async function onDelete(r: DichVuRow) {
    const ok = confirm(`Tắt (xóa mềm) dịch vụ "${r.tenDichVu}"?`);
    if (!ok) return;
    try {
      await dvApi.remove(r.id);
      await load();
    } catch (e: any) {
      alert(String(e?.response?.data ?? "Không xóa được"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dịch vụ</h1>
          <p className="text-sm text-slate-600 mt-1">Quản lý dịch vụ, giá, trạng thái hiển thị online</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreate}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Thêm dịch vụ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Tìm mã / tên..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select className="rounded-xl border px-3 py-2 text-sm" value={active} onChange={(e) => setActive(e.target.value as any)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Ngừng</option>
          </select>

          <select className="rounded-xl border px-3 py-2 text-sm" value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {cats.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.tenDanhMuc}
              </option>
            ))}
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

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
          <div className="text-sm font-semibold">Danh sách dịch vụ</div>
          <div className="text-xs text-slate-500">Tổng: {view.length}</div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr className="border-b">
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">Danh mục</th>
                <th className="px-4 py-3 font-medium text-right">Giá</th>
                <th className="px-4 py-3 font-medium">Online</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>Đang tải...</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>Không có dữ liệu</td></tr>
              ) : (
                view.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.maDichVu}</td>
                    <td className="px-4 py-3">{r.tenDichVu}</td>
                    <td className="px-4 py-3 text-slate-700">{r.danhMucTen ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.giaHienTai.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-4 py-3">
                      <Badge ok={r.isOnlineVisible} onLabel="Hiện" offLabel="Ẩn" />
                    </td>
                    <td className="px-4 py-3">
                      <Badge ok={r.isActive} onLabel="Đang hoạt động" offLabel="Ngừng" />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEdit(r.id)}
                        className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        Sửa
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

      {/* Modal Create/Edit */}
      <Modal open={open} title={mode === "create" ? "Thêm dịch vụ" : "Cập nhật dịch vụ"} onClose={() => setOpen(false)}>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-sm">
              Mã dịch vụ {mode === "edit" && <span className="text-slate-500">(không đổi)</span>}
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={maDichVu}
                onChange={(e) => setMaDichVu(e.target.value)}
                disabled={mode === "edit"}
                placeholder="VD: GOIDAU"
              />
            </label>

            <label className="block text-sm">
              Danh mục
              <select className="mt-1 w-full rounded-xl border px-3 py-2" value={danhMucId} onChange={(e) => setDanhMucId(e.target.value)}>
                <option value="">(Không chọn)</option>
                {cats.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.tenDanhMuc}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm md:col-span-2">
              Tên dịch vụ
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={tenDichVu}
                onChange={(e) => setTenDichVu(e.target.value)}
                placeholder="VD: Gội đầu dưỡng sinh"
              />
            </label>

            <label className="block text-sm">
              Giá hiện tại
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={giaHienTai}
                onChange={(e) => setGiaHienTai(e.target.value)}
                placeholder="VD: 250000"
              />
            </label>

            <label className="block text-sm">
             <div>Giá gốc (&gt;= giá hiện tại)</div>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={giaGoc} onChange={(e) => setGiaGoc(e.target.value)} />
            </label>

            <label className="block text-sm">
              Thời lượng (phút)
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={thoiLuongPhut} onChange={(e) => setThoiLuongPhut(e.target.value)} />
            </label>

            <label className="block text-sm">
              Thứ tự hiển thị
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={thuTuHienThi} onChange={(e) => setThuTuHienThi(e.target.value)} />
            </label>

            <label className="block text-sm md:col-span-2">
              Mô tả ngắn
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} value={moTaNgan} onChange={(e) => setMoTaNgan(e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Đang hoạt động
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isOnlineVisible} onChange={(e) => setIsOnlineVisible(e.target.checked)} />
              Hiển thị online
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isCombo} onChange={(e) => setIsCombo(e.target.checked)} />
              Là combo
            </label>
          </div>

          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {String(err)}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">
              Hủy
            </button>
            <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
