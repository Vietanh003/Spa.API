import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { baiVietAdminApi, type BaiVietAdminRow } from "../api/baiViet";
import { uploadApi } from "../api/upload";

type Mode = "create" | "edit";

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
      try { return JSON.stringify(data); } catch { return String(data); }
    }
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateTime(v: string | null | undefined) {
  if (!v) return "—";
  const dt = new Date(v);
  if (!Number.isFinite(dt.getTime())) return String(v);
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(dt);
  } catch { return String(v); }
}

function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-2xl border bg-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-semibold">{title}</div>
          <button className="rounded-lg px-2 py-1 text-sm hover:bg-slate-100" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export default function BlogAdminPage() {
  const [rows, setRows] = useState<BaiVietAdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  // form fields
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [tieuDe, setTieuDe] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const [tacGia, setTacGia] = useState("DiemSuong SPA");
  const [thoiGianDoc, setThoiGianDoc] = useState<string>("");
  const [moTaNgan, setMoTaNgan] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [ngayDang, setNgayDang] = useState<string>("");

  // media: cover image
  const [anhBia, setAnhBia] = useState<string>("");
  const [anhBiaFile, setAnhBiaFile] = useState<File | null>(null);
  const [anhBiaPreview, setAnhBiaPreview] = useState<string>("");
  const anhBiaRef = useRef<HTMLInputElement | null>(null);

  // media: video
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const videoRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState<number>(0);

  function revokeAnhBia() { if (anhBiaPreview) URL.revokeObjectURL(anhBiaPreview); }
  function revokeVideoPreview() { if (videoPreview) URL.revokeObjectURL(videoPreview); }

  function pickCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (anhBiaRef.current) anhBiaRef.current.value = "";
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!/\.(jpg|jpeg|png|webp|gif)$/.test(name)) return setErr("Ảnh bìa phải là jpg/png/webp/gif.");
    if (file.size > 5 * 1024 * 1024) return setErr("Ảnh bìa <= 5MB.");
    revokeAnhBia();
    setAnhBiaFile(file);
    setAnhBiaPreview(URL.createObjectURL(file));
    setAnhBia("");
  }

  function pickVideo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (videoRef.current) videoRef.current.value = "";
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!/\.(mp4|webm|mov|m4v)$/.test(name)) return setErr("Video phải là mp4/webm/mov/m4v.");
    if (file.size > 100 * 1024 * 1024) return setErr("Video <= 100MB.");
    revokeVideoPreview();
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setVideoUrl("");
  }

  function clearCover() {
    revokeAnhBia();
    setAnhBiaFile(null);
    setAnhBiaPreview("");
    setAnhBia("");
  }
  function clearVideo() {
    revokeVideoPreview();
    setVideoFile(null);
    setVideoPreview("");
    setVideoUrl("");
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params: { q?: string; published?: boolean } = {};
      if (q.trim()) params.q = q.trim();
      if (filter === "published") params.published = true;
      if (filter === "draft") params.published = false;
      const data = await baiVietAdminApi.list(params);
      setRows(data);
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

  function resetForm() {
    setSlug("");
    setSlugDirty(false);
    setTieuDe("");
    setDanhMuc("");
    setTacGia("DiemSuong SPA");
    setThoiGianDoc("");
    setMoTaNgan("");
    setNoiDung("");
    setIsPublished(false);
    setNgayDang("");
    clearCover();
    clearVideo();
    setEditingId(null);
    setErr(null);
    setUploadPct(0);
  }

  function openCreate() {
    resetForm();
    setMode("create");
    setOpen(true);
  }

  async function openEdit(id: number) {
    resetForm();
    setMode("edit");
    setEditingId(id);
    setOpen(true);
    try {
      const d = await baiVietAdminApi.get(id);
      setSlug(d.slug);
      setSlugDirty(true);
      setTieuDe(d.tieuDe);
      setDanhMuc(d.danhMuc ?? "");
      setTacGia(d.tacGia ?? "");
      setThoiGianDoc(d.thoiGianDocPhut == null ? "" : String(d.thoiGianDocPhut));
      setMoTaNgan(d.moTaNgan ?? "");
      setNoiDung(d.noiDung ?? "");
      setIsPublished(d.isPublished);
      setNgayDang(d.ngayDang ? d.ngayDang.slice(0, 16) : "");
      setAnhBia(d.anhBia ?? "");
      setVideoUrl(d.videoUrl ?? "");
    } catch (e: unknown) {
      setErr(getErrorText(e, "Không tải được chi tiết"));
    }
  }

  function closeModal() {
    setOpen(false);
    clearCover();
    clearVideo();
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setErr(null);

    const t = tieuDe.trim();
    if (!t) return setErr("Tiêu đề là bắt buộc.");
    const slugFinal = (slugDirty ? slug : slugify(t)).trim();
    if (!slugFinal) return setErr("Slug không hợp lệ.");

    const minutes = thoiGianDoc.trim() === "" ? null : Number(thoiGianDoc);
    if (minutes != null && (!Number.isFinite(minutes) || minutes < 0)) return setErr("Thời gian đọc không hợp lệ.");

    setSaving(true);
    setUploadPct(0);

    // Upload ảnh bìa nếu có file local
    let anhBiaFinal: string | null = anhBia.trim() === "" ? null : anhBia.trim();
    if (anhBiaFile) {
      try {
        const res = await uploadApi.image(anhBiaFile, "blog", setUploadPct);
        anhBiaFinal = res.url;
      } catch (ex: unknown) {
        setSaving(false);
        return setErr(getErrorText(ex, "Upload ảnh bìa thất bại"));
      } finally {
        setUploadPct(0);
      }
    }

    // Upload video nếu có file local
    let videoFinal: string | null = videoUrl.trim() === "" ? null : videoUrl.trim();
    if (videoFile) {
      try {
        const res = await uploadApi.video(videoFile, "blog", setUploadPct);
        videoFinal = res.url;
      } catch (ex: unknown) {
        setSaving(false);
        return setErr(getErrorText(ex, "Upload video thất bại"));
      } finally {
        setUploadPct(0);
      }
    }

    const ngayDangISO = ngayDang.trim() === "" ? null : `${ngayDang}:00`;

    const common = {
      tieuDe: t,
      moTaNgan: moTaNgan.trim() === "" ? null : moTaNgan.trim(),
      noiDung: noiDung.trim() === "" ? null : noiDung,
      danhMuc: danhMuc.trim() === "" ? null : danhMuc.trim(),
      anhBia: anhBiaFinal,
      videoUrl: videoFinal,
      tacGia: tacGia.trim() === "" ? null : tacGia.trim(),
      thoiGianDocPhut: minutes,
      isPublished,
      ngayDang: ngayDangISO,
    };

    try {
      if (mode === "create") {
        await baiVietAdminApi.create({ slug: slugFinal, ...common });
      } else {
        if (!editingId) { setSaving(false); return; }
        await baiVietAdminApi.update(editingId, common);
      }
      closeModal();
      await load();
    } catch (e: unknown) {
      setErr(getErrorText(e, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(r: BaiVietAdminRow) {
    if (!confirm(`Xóa bài viết "${r.tieuDe}"?`)) return;
    try {
      await baiVietAdminApi.remove(r.id);
      await load();
    } catch (e: unknown) {
      alert(getErrorText(e, "Xóa thất bại"));
    }
  }

  const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog / Bài viết</h1>
          <p className="text-sm text-slate-600 mt-1">Quản lý nội dung blog, ảnh bìa và video minh hoạ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openCreate} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            + Thêm bài viết
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className={inputCls}
            placeholder="Tìm tiêu đề / slug / danh mục..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
          />
          <select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">Tất cả</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>
          <button onClick={load} className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">Áp dụng lọc</button>
        </div>

        {err && !open && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{String(err)}</div>
        )}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
          <div className="text-sm font-semibold">Danh sách bài viết</div>
          <div className="text-xs text-slate-500">Tổng: {view.length}</div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr className="border-b">
                <th className="px-4 py-3 font-medium w-16">Ảnh</th>
                <th className="px-4 py-3 font-medium">Tiêu đề</th>
                <th className="px-4 py-3 font-medium">Danh mục</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Cập nhật</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>Đang tải...</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>Không có bài viết</td></tr>
              ) : (
                view.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {r.anhBia ? (
                        <img src={r.anhBia} alt="" className="h-12 w-16 rounded-lg object-cover border" />
                      ) : (
                        <div className="h-12 w-16 rounded-lg border bg-slate-100" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.tieuDe}</div>
                      <div className="text-xs text-slate-500">/{r.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.danhMuc ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        r.isPublished
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-700 ring-slate-200"
                      )}>
                        {r.isPublished ? "Đã xuất bản" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(r.updatedAt ?? r.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(r.id)} className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-slate-50">Sửa</button>
                      <button onClick={() => onDelete(r)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title={mode === "create" ? "Thêm bài viết" : "Cập nhật bài viết"} onClose={closeModal}>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Tiêu đề <span className="text-rose-600">*</span></span>
              <input className={inputCls} value={tieuDe} onChange={(e) => {
                setTieuDe(e.target.value);
                if (!slugDirty) setSlug(slugify(e.target.value));
              }} required />
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Slug <span className="text-rose-600">*</span></span>
              <input
                className={inputCls}
                value={slug}
                onChange={(e) => { setSlug(slugify(e.target.value)); setSlugDirty(true); }}
                placeholder="vd: 5-thoi-quen-thu-gian"
                required
              />
              <div className="mt-1 text-xs text-slate-500">URL: /blog/{slug || "..."}</div>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Danh mục</span>
              <input className={inputCls} value={danhMuc} onChange={(e) => setDanhMuc(e.target.value)} placeholder="VD: Chăm sóc da" />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Tác giả</span>
              <input className={inputCls} value={tacGia} onChange={(e) => setTacGia(e.target.value)} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Thời gian đọc (phút)</span>
              <input className={inputCls} type="number" min={0} value={thoiGianDoc} onChange={(e) => setThoiGianDoc(e.target.value)} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Ngày đăng</span>
              <input className={inputCls} type="datetime-local" value={ngayDang} onChange={(e) => setNgayDang(e.target.value)} />
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Mô tả ngắn</span>
              <textarea className={inputCls} rows={2} value={moTaNgan} onChange={(e) => setMoTaNgan(e.target.value)} maxLength={500} />
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Nội dung</span>
              <textarea className={inputCls} rows={10} value={noiDung} onChange={(e) => setNoiDung(e.target.value)} placeholder="Nội dung bài viết (hỗ trợ xuống dòng. Có thể paste HTML/Markdown)." />
            </label>

            {/* Ảnh bìa */}
            <div className="md:col-span-2 rounded-2xl border bg-slate-50 p-3">
              <div className="text-sm font-semibold">Ảnh bìa</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => anhBiaRef.current?.click()} className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">
                  Chọn ảnh từ máy
                </button>
                <input ref={anhBiaRef} type="file" accept="image/*" className="hidden" onChange={pickCover} />
                {(anhBiaFile || anhBia.trim() !== "") && (
                  <button type="button" onClick={clearCover} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100">
                    Xóa ảnh
                  </button>
                )}
              </div>
              <input
                className={cn(inputCls, "mt-2")}
                value={anhBia}
                onChange={(e) => {
                  if (anhBiaFile) { revokeAnhBia(); setAnhBiaFile(null); setAnhBiaPreview(""); }
                  setAnhBia(e.target.value);
                }}
                placeholder="Hoặc dán URL: https://..."
                disabled={!!anhBiaFile}
              />
              {(anhBiaPreview || anhBia.trim() !== "") && (
                <div className="mt-3">
                  <img className="aspect-[16/9] w-full max-w-md rounded-xl border object-cover" src={anhBiaPreview || anhBia} alt="Cover" />
                  {anhBiaFile && <div className="mt-1 text-xs text-amber-700 font-medium">Chưa lưu — sẽ upload khi bấm Lưu</div>}
                </div>
              )}
            </div>

            {/* Video */}
            <div className="md:col-span-2 rounded-2xl border bg-slate-50 p-3">
              <div className="text-sm font-semibold">Video (tuỳ chọn)</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => videoRef.current?.click()} className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50">
                  Chọn video từ máy
                </button>
                <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={pickVideo} />
                {(videoFile || videoUrl.trim() !== "") && (
                  <button type="button" onClick={clearVideo} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100">
                    Xóa video
                  </button>
                )}
              </div>
              <input
                className={cn(inputCls, "mt-2")}
                value={videoUrl}
                onChange={(e) => {
                  if (videoFile) { revokeVideoPreview(); setVideoFile(null); setVideoPreview(""); }
                  setVideoUrl(e.target.value);
                }}
                placeholder="Hoặc dán URL video (mp4/webm/youtube embed): https://..."
                disabled={!!videoFile}
              />
              {(videoPreview || videoUrl.trim() !== "") && (
                <div className="mt-3">
                  {/\.(mp4|webm|mov|m4v)(\?|$)/i.test(videoPreview || videoUrl) || videoPreview ? (
                    <video src={videoPreview || videoUrl} controls className="aspect-video w-full max-w-md rounded-xl border" />
                  ) : (
                    <div className="rounded-xl border bg-white p-3 text-xs text-slate-600 break-all">{videoUrl}</div>
                  )}
                  {videoFile && <div className="mt-1 text-xs text-amber-700 font-medium">Chưa lưu — sẽ upload khi bấm Lưu</div>}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              Xuất bản công khai (hiển thị ngoài trang khách hàng)
            </label>
          </div>

          {saving && uploadPct > 0 && uploadPct < 100 && (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Đang upload media... {uploadPct}%
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{String(err)}</div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60">
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
