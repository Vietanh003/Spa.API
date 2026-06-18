import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { dvApi, type DichVuRow, type DichVuDetail } from "../api/dichVu";
import { danhMucApi, type DanhMucOption } from "../api/danhMucDichVu";
import { uploadApi } from "../api/upload";

type Mode = "create" | "edit";

function cn(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function toDateTimeLocal(v: string | null | undefined) {
  if (!v) return "";
  const s = String(v);
  // ISO: 2026-04-17T10:20:30 -> datetime-local thích 2026-04-17T10:20
  if (s.includes("T") && s.length >= 16) return s.slice(0, 16);
  // Date-only: 2026-04-17
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00`;
  return s;
}

function normalizeDateTimeForApi(v: string) {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return s;
}

function parseImageLines(text: string) {
  const items = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set(items));
}

function hinhAnhJsonToLines(jsonStr: string | null | undefined) {
  if (!jsonStr) return "";
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x ?? "").trim()).filter(Boolean).join("\n");
  } catch {
    // ignore
  }
  return String(jsonStr);
}

function getErrorText(e: unknown, fallback: string) {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const maybe = e as { message?: unknown; response?: { data?: unknown } };
    const data = maybe.response?.data;
    if (typeof data === "string") return data;
    if (data != null) {
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
        <div className="p-4 max-h-[80vh] overflow-auto">{children}</div>
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
  const [moTa, setMoTa] = useState("");
  const [lieuTrinh, setLieuTrinh] = useState("");
  const [phanTramGiam, setPhanTramGiam] = useState<string>("");
  const [apDungTu, setApDungTu] = useState<string>("");
  const [apDungDen, setApDungDen] = useState<string>("");
  const [soBuoi, setSoBuoi] = useState<string>("");
  const [thoiGianHieuLucNgay, setThoiGianHieuLucNgay] = useState<string>("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [hinhAnhChinh, setHinhAnhChinh] = useState("");
  const [hinhAnhPhuText, setHinhAnhPhuText] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isOnlineVisible, setIsOnlineVisible] = useState(true);
  const [isCombo, setIsCombo] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mainFileRef = useRef<HTMLInputElement | null>(null);
  const extraFileRef = useRef<HTMLInputElement | null>(null);

  // Local pending files — only uploaded khi bấm "Lưu"
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFilePreview, setMainFilePreview] = useState<string>("");
  const [pendingExtras, setPendingExtras] = useState<Array<{ file: File; preview: string }>>([]);

  const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — khớp backend

  function validateImageFile(f: File): string | null {
    const name = (f.name ?? "").toLowerCase();
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    if (!ALLOWED_EXT.includes(ext)) {
      return `File "${f.name}" sai định dạng. Cho phép: jpg, jpeg, png, webp, gif.`;
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File "${f.name}" lớn hơn 5MB (${(f.size / 1024 / 1024).toFixed(1)}MB).`;
    }
    return null;
  }

  function revokeMainPreview() {
    if (mainFilePreview) URL.revokeObjectURL(mainFilePreview);
  }

  function revokePendingExtras(list: Array<{ file: File; preview: string }>) {
    for (const it of list) URL.revokeObjectURL(it.preview);
  }

  function handlePickMain(e: ChangeEvent<HTMLInputElement>) {
    // Capture File trước, rồi mới reset input (FileList là live reference)
    const file = e.target.files?.[0] ?? null;
    if (mainFileRef.current) mainFileRef.current.value = "";
    if (!file) return;
    setErr(null);
    const invalid = validateImageFile(file);
    if (invalid) {
      setErr(invalid);
      return;
    }
    revokeMainPreview();
    const preview = URL.createObjectURL(file);
    setMainFile(file);
    setMainFilePreview(preview);
    setHinhAnhChinh("");
  }

  function clearMainImage() {
    revokeMainPreview();
    setMainFile(null);
    setMainFilePreview("");
    setHinhAnhChinh("");
  }

  function handlePickExtra(e: ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    // Phải copy FileList sang array TRƯỚC khi clear input.value
    // vì FileList là live reference — clear input xong list cũng rỗng.
    const picked = fileList ? Array.from(fileList) : [];
    if (extraFileRef.current) extraFileRef.current.value = "";
    if (picked.length === 0) return;
    setErr(null);
    const additions: Array<{ file: File; preview: string }> = [];
    const errors: string[] = [];
    for (const f of picked) {
      const invalid = validateImageFile(f);
      if (invalid) {
        errors.push(invalid);
        continue;
      }
      additions.push({ file: f, preview: URL.createObjectURL(f) });
    }
    if (additions.length > 0) {
      setPendingExtras((prev) => [...prev, ...additions]);
    }
    if (errors.length > 0) {
      setErr(errors.join(" | "));
    }
  }

  function removePendingExtra(idx: number) {
    setPendingExtras((prev) => {
      const item = prev[idx];
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function removeExtraImage(url: string) {
    const list = parseImageLines(hinhAnhPhuText).filter((x) => x !== url);
    setHinhAnhPhuText(list.join("\n"));
  }

  async function loadCats() {
    const data = await danhMucApi.list();
    setCats(data);
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params: { active?: boolean; danhMucId?: number; q?: string } = {};
      const kw = q.trim();
      if (kw) params.q = kw;
      if (active !== "all") params.active = active === "true";
      if (catId) params.danhMucId = Number(catId);
      const data = await dvApi.list(params);
      setRows(data);
    } catch (e: unknown) {
      setErr(getErrorText(e, "Không tải được dữ liệu"));
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
    setMoTa("");
    setLieuTrinh("");
    setPhanTramGiam("");
    setApDungTu("");
    setApDungDen("");
    setSoBuoi("");
    setThoiGianHieuLucNgay("");
    setSku("");
    setBarcode("");
    setHinhAnhChinh("");
    setHinhAnhPhuText("");
    setSlug("");
    setMetaTitle("");
    setMetaDescription("");
    setIsActive(true);
    setIsOnlineVisible(true);
    setIsCombo(false);
    setEditingId(null);
    setErr(null);

    revokeMainPreview();
    setMainFile(null);
    setMainFilePreview("");
    revokePendingExtras(pendingExtras);
    setPendingExtras([]);
  }

  function closeModal() {
    setOpen(false);
    revokeMainPreview();
    setMainFile(null);
    setMainFilePreview("");
    revokePendingExtras(pendingExtras);
    setPendingExtras([]);
  }

  function openCreate() {
    resetForm();
    setMode("create");
    setOpen(true);
  }

  async function openEdit(id: number) {
    resetForm();
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
      setMoTa(d.moTa ?? "");
      setLieuTrinh(d.lieuTrinh ?? "");
      setPhanTramGiam(d.phanTramGiam == null ? "" : String(d.phanTramGiam));
      setApDungTu(toDateTimeLocal(d.apDungTu));
      setApDungDen(toDateTimeLocal(d.apDungDen));
      setSoBuoi(d.soBuoi == null ? "" : String(d.soBuoi));
      setThoiGianHieuLucNgay(d.thoiGianHieuLucNgay == null ? "" : String(d.thoiGianHieuLucNgay));
      setSku(d.sku ?? "");
      setBarcode(d.barcode ?? "");
      setHinhAnhChinh(d.hinhAnhChinh ?? "");
      setHinhAnhPhuText(hinhAnhJsonToLines(d.hinhAnhJson));
      setSlug(d.slug ?? "");
      setMetaTitle(d.metaTitle ?? "");
      setMetaDescription(d.metaDescription ?? "");
      setIsActive(!!d.isActive);
      setIsOnlineVisible(!!d.isOnlineVisible);
      setIsCombo(!!d.isCombo);
    } catch (e: unknown) {
      setErr(getErrorText(e, "Không tải được chi tiết"));
    }
  }

  function isHttpImageUrl(value: string) {
    const s = value.trim();
    if (!s || s.startsWith("data:")) return false;
    try {
      const url = new URL(s);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setErr(null);

    const ten = tenDichVu.trim();
    if (!ten) return setErr("Tên dịch vụ là bắt buộc.");
    const ma = maDichVu.trim();
    if (mode === "create" && !ma) return setErr("Mã dịch vụ là bắt buộc.");

    const price = Number(giaHienTai);
    if (Number.isNaN(price) || price < 0) return setErr("Giá hiện tại không hợp lệ.");

    const giaGocNum = giaGoc.trim() === "" ? null : Number(giaGoc);
    if (giaGocNum !== null && (Number.isNaN(giaGocNum) || giaGocNum < 0)) return setErr("Giá gốc không hợp lệ.");
    if (giaGocNum !== null && giaGocNum < price) return setErr("Giá gốc phải >= giá hiện tại.");

    const tlNum = thoiLuongPhut.trim() === "" ? null : Number(thoiLuongPhut);
    if (tlNum !== null && (Number.isNaN(tlNum) || tlNum < 0)) return setErr("Thời lượng không hợp lệ.");

    const ttNum = thuTuHienThi.trim() === "" ? null : Number(thuTuHienThi);
    if (ttNum !== null && Number.isNaN(ttNum)) return setErr("Thứ tự hiển thị không hợp lệ.");

    const dmNum = danhMucId.trim() === "" ? null : Number(danhMucId);
    if (dmNum !== null && Number.isNaN(dmNum)) return setErr("Danh mục không hợp lệ.");

    const giamNum = phanTramGiam.trim() === "" ? null : Number(phanTramGiam);
    if (giamNum !== null && (Number.isNaN(giamNum) || giamNum < 0 || giamNum > 100)) return setErr("% giảm không hợp lệ (0-100).");

    const soBuoiNum = soBuoi.trim() === "" ? null : Number(soBuoi);
    if (soBuoiNum !== null && (Number.isNaN(soBuoiNum) || soBuoiNum < 0)) return setErr("Số buổi không hợp lệ.");

    const hieuLucNum = thoiGianHieuLucNgay.trim() === "" ? null : Number(thoiGianHieuLucNgay);
    if (hieuLucNum !== null && (Number.isNaN(hieuLucNum) || hieuLucNum < 0)) return setErr("Hiệu lực (ngày) không hợp lệ.");

    const apTu = normalizeDateTimeForApi(apDungTu);
    const apDen = normalizeDateTimeForApi(apDungDen);

    setSaving(true);

    // Upload ảnh chính (nếu có file local đang chờ)
    let hinhChinh: string | null = hinhAnhChinh.trim() === "" ? null : hinhAnhChinh.trim();
    if (mainFile) {
      try {
        const res = await uploadApi.image(mainFile, "dich-vu");
        hinhChinh = res.url;
        revokeMainPreview();
        setMainFile(null);
        setMainFilePreview("");
        setHinhAnhChinh(res.url);
      } catch (ex: unknown) {
        setSaving(false);
        return setErr(getErrorText(ex, "Upload ảnh chính thất bại"));
      }
    }

    // Upload ảnh phụ (nếu có file local đang chờ)
    const existedExtras = parseImageLines(hinhAnhPhuText);
    let uploadedExtras: string[] = [];
    if (pendingExtras.length > 0) {
      try {
        for (const item of pendingExtras) {
          const res = await uploadApi.image(item.file, "dich-vu");
          uploadedExtras.push(res.url);
        }
      } catch (ex: unknown) {
        setSaving(false);
        return setErr(getErrorText(ex, "Upload ảnh phụ thất bại"));
      }
      revokePendingExtras(pendingExtras);
      setPendingExtras([]);
    }
    const extraImgs = Array.from(new Set([...existedExtras, ...uploadedExtras]));
    if (uploadedExtras.length > 0) {
      setHinhAnhPhuText(extraImgs.join("\n"));
    }
    const hinhJson = extraImgs.length ? JSON.stringify(extraImgs) : null;

    if (hinhChinh !== null && !isHttpImageUrl(hinhChinh)) {
      setSaving(false);
      return setErr("Ảnh chính phải là link http/https, không dùng base64.");
    }
    if (extraImgs.some((x) => !isHttpImageUrl(x))) {
      setSaving(false);
      return setErr("Ảnh phụ phải là link http/https, không dùng base64.");
    }

    const dtoCommon = {
      danhMucId: dmNum,
      tenDichVu: ten,
      moTaNgan: moTaNgan.trim() === "" ? null : moTaNgan,
      moTa: moTa.trim() === "" ? null : moTa,
      lieuTrinh: lieuTrinh.trim() === "" ? null : lieuTrinh,
      giaHienTai: price,
      giaGoc: giaGocNum,
      phanTramGiam: giamNum,
      apDungTu: apTu,
      apDungDen: apDen,
      thoiLuongPhut: tlNum,
      soBuoi: soBuoiNum,
      thoiGianHieuLucNgay: hieuLucNum,
      sku: sku.trim() === "" ? null : sku.trim(),
      barcode: barcode.trim() === "" ? null : barcode.trim(),
      isCombo,
      isOnlineVisible,
      isActive,
      thuTuHienThi: ttNum,
      hinhAnhChinh: hinhChinh,
      hinhAnhJson: hinhJson,
      slug: slug.trim() === "" ? null : slug.trim(),
      metaTitle: metaTitle.trim() === "" ? null : metaTitle.trim(),
      metaDescription: metaDescription.trim() === "" ? null : metaDescription.trim(),
    };

    try {
      if (mode === "create") {
        await dvApi.create({
          ...dtoCommon,
          maDichVu: ma,
        });
      } else {
        if (!editingId) {
          setSaving(false);
          return;
        }
        await dvApi.update(editingId, {
          ...dtoCommon,
        });
      }
      closeModal();
      await load();
    } catch (e: unknown) {
      setErr(getErrorText(e, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(r: DichVuRow) {
    const ok = confirm(`Tắt (xóa mềm) dịch vụ "${r.tenDichVu}"?`);
    if (!ok) return;
    try {
      await dvApi.remove(r.id);
      await load();
    } catch (e: unknown) {
      alert(getErrorText(e, "Không xóa được"));
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

          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={active}
            onChange={(e) => setActive(e.target.value as "all" | "true" | "false")}
          >
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
      <Modal open={open} title={mode === "create" ? "Thêm dịch vụ" : "Cập nhật dịch vụ"} onClose={closeModal}>
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
                inputMode="numeric"
                value={giaHienTai}
                onChange={(e) => setGiaHienTai(e.target.value)}
                placeholder="VD: 250000"
              />
            </label>

            <label className="block text-sm">
             <div>Giá gốc (&gt;= giá hiện tại)</div>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" value={giaGoc} onChange={(e) => setGiaGoc(e.target.value)} />
            </label>

            <label className="block text-sm">
              Thời lượng (phút)
              <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" value={thoiLuongPhut} onChange={(e) => setThoiLuongPhut(e.target.value)} />
            </label>

            <label className="block text-sm">
              Thứ tự hiển thị
              <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" value={thuTuHienThi} onChange={(e) => setThuTuHienThi(e.target.value)} />
            </label>

            <label className="block text-sm md:col-span-2">
              Mô tả ngắn
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} value={moTaNgan} onChange={(e) => setMoTaNgan(e.target.value)} />
            </label>

            <label className="block text-sm md:col-span-2">
              Mô tả chi tiết
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={4} value={moTa} onChange={(e) => setMoTa(e.target.value)} />
            </label>

            <label className="block text-sm md:col-span-2">
              Liệu trình
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={4} value={lieuTrinh} onChange={(e) => setLieuTrinh(e.target.value)} />
            </label>

            <label className="block text-sm">
              % giảm (0-100)
              <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" value={phanTramGiam} onChange={(e) => setPhanTramGiam(e.target.value)} placeholder="VD: 10" />
            </label>

            <label className="block text-sm">
              Số buổi
              <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" value={soBuoi} onChange={(e) => setSoBuoi(e.target.value)} placeholder="VD: 5" />
            </label>

            <label className="block text-sm">
              Hiệu lực (ngày)
              <input className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" value={thoiGianHieuLucNgay} onChange={(e) => setThoiGianHieuLucNgay(e.target.value)} placeholder="VD: 30" />
            </label>

            <label className="block text-sm">
              Áp dụng từ
              <input className="mt-1 w-full rounded-xl border px-3 py-2" type="datetime-local" value={apDungTu} onChange={(e) => setApDungTu(e.target.value)} />
            </label>

            <label className="block text-sm">
              Áp dụng đến
              <input className="mt-1 w-full rounded-xl border px-3 py-2" type="datetime-local" value={apDungDen} onChange={(e) => setApDungDen(e.target.value)} />
            </label>

            <label className="block text-sm">
              SKU
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="VD: DV-001" />
            </label>

            <label className="block text-sm">
              Barcode
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="VD: 893..." />
            </label>

            <div className="md:col-span-2 rounded-2xl border bg-slate-50 p-3">
              <div className="text-sm font-semibold">Hình ảnh</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="block text-sm font-medium">Ảnh chính</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => mainFileRef.current?.click()}
                      className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      Chọn ảnh từ máy
                    </button>
                    <input
                      ref={mainFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickMain}
                    />
                    {(mainFile || hinhAnhChinh.trim() !== "") && (
                      <button
                        type="button"
                        onClick={clearMainImage}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                  <input
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm disabled:bg-slate-100"
                    value={hinhAnhChinh}
                    onChange={(e) => {
                      if (mainFile) {
                        revokeMainPreview();
                        setMainFile(null);
                        setMainFilePreview("");
                      }
                      setHinhAnhChinh(e.target.value);
                    }}
                    placeholder="Hoặc dán URL: https://..."
                    disabled={!!mainFile}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {(mainFilePreview || hinhAnhChinh.trim() !== "") && (
                      <div className="relative">
                        <img
                          className="h-24 w-24 rounded-xl border object-cover"
                          src={mainFilePreview || hinhAnhChinh.trim()}
                          alt="Ảnh chính"
                        />
                        {mainFile && (
                          <span className="absolute -bottom-1 left-0 right-0 mx-auto w-fit rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                            Chưa lưu
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="block text-sm font-medium">Ảnh phụ</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => extraFileRef.current?.click()}
                      className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      Chọn nhiều ảnh từ máy
                    </button>
                    <input
                      ref={extraFileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePickExtra}
                    />
                  </div>
                  <textarea
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                    rows={3}
                    value={hinhAnhPhuText}
                    onChange={(e) => setHinhAnhPhuText(e.target.value)}
                    placeholder="Mỗi dòng 1 URL (ảnh đã lưu), hoặc dùng nút chọn ảnh ở trên"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {parseImageLines(hinhAnhPhuText)
                      .slice(0, 12)
                      .map((src, idx) => (
                        <div key={`url-${src}-${idx}`} className="relative">
                          <img className="h-16 w-16 rounded-xl border object-cover" src={src} alt={`Ảnh phụ ${idx + 1}`} />
                          <button
                            type="button"
                            onClick={() => removeExtraImage(src)}
                            className="absolute -top-1 -right-1 rounded-full bg-rose-600 px-1.5 text-[10px] leading-4 text-white shadow"
                            aria-label="Xóa ảnh"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    {pendingExtras.map((item, idx) => (
                      <div key={`pending-${idx}`} className="relative">
                        <img className="h-16 w-16 rounded-xl border object-cover" src={item.preview} alt={`Ảnh chờ ${idx + 1}`} />
                        <button
                          type="button"
                          onClick={() => removePendingExtra(idx)}
                          className="absolute -top-1 -right-1 rounded-full bg-rose-600 px-1.5 text-[10px] leading-4 text-white shadow"
                          aria-label="Xóa ảnh"
                        >
                          ×
                        </button>
                        <span className="absolute -bottom-1 left-0 right-0 mx-auto w-fit rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow">
                          Chưa lưu
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Hệ thống sẽ upload các ảnh chờ lên server khi bạn bấm "Lưu", rồi lưu dạng JSON vào HinhAnhJson.
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border bg-slate-50 p-3">
              <div className="text-sm font-semibold">SEO</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block text-sm">
                  Slug
                  <input className="mt-1 w-full rounded-xl border px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="vd: goi-dau-duong-sinh" />
                </label>
                <label className="block text-sm">
                  Meta title
                  <input className="mt-1 w-full rounded-xl border px-3 py-2" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                </label>
                <label className="block text-sm md:col-span-2">
                  Meta description
                  <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                </label>
              </div>
            </div>
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
            <button type="button" onClick={closeModal} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50" disabled={saving}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
