import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Tag } from "lucide-react";
import { type DichVuDetail } from "../../api/dichVu";
import { dvPublicApi, type DichVuPublicRow } from "../../api/dichVuPublic";
import { formatVnd } from "../lib/format";

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

function parseImages(d: DichVuDetail) {
  const images: string[] = [];
  const main = (d.hinhAnhChinh ?? "").trim();
  if (main) images.push(main);
  const json = (d.hinhAnhJson ?? "").trim();
  if (!json) return images;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      for (const it of parsed) {
        const s = String(it ?? "").trim();
        if (s) images.push(s);
      }
    }
  } catch {
    // ignore
  }
  return Array.from(new Set(images));
}

function calcDiscountPercent(giaGoc: number | null, giaHienTai: number) {
  if (giaGoc == null) return null;
  if (!(giaGoc > 0)) return null;
  if (!(giaGoc > giaHienTai)) return null;
  const pct = Math.round(((giaGoc - giaHienTai) / giaGoc) * 100);
  if (!Number.isFinite(pct) || pct <= 0) return null;
  return pct;
}

function formatDateTime(v: string | null | undefined) {
  if (!v) return null;
  const dt = new Date(v);
  if (!Number.isFinite(dt.getTime())) return String(v);
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(dt);
  } catch {
    return String(v);
  }
}

function ImagePlaceholder() {
  return <div className="aspect-[4/3] w-full bg-gradient-to-br from-amber-100 via-stone-200 to-stone-300" />;
}

export default function CustomerServiceDetail() {
  const nav = useNavigate();
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [d, setD] = useState<DichVuDetail | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");

  const [related, setRelated] = useState<DichVuPublicRow[]>([]);

  const images = useMemo(() => (d ? parseImages(d) : []), [d]);

  useEffect(() => {
    setActiveImage(images[0] ?? "");
  }, [images]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setErr("ID dịch vụ không hợp lệ");
      return;
    }
    let alive = true;
    setLoading(true);
    setErr(null);
    dvPublicApi
      .get(id)
      .then((data) => {
        if (!alive) return;
        setD(data);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setErr(getErrorText(e, "Không tải được chi tiết dịch vụ"));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  // Tải các dịch vụ cùng danh mục để gợi ý
  useEffect(() => {
    if (!d || d.danhMucId == null) {
      setRelated([]);
      return;
    }
    let alive = true;
    dvPublicApi
      .list({ danhMucId: d.danhMucId })
      .then((rows) => {
        if (!alive) return;
        const items = (Array.isArray(rows) ? rows : []).filter((x) => x.id !== d.id).slice(0, 4);
        setRelated(items);
      })
      .catch(() => {
        if (!alive) return;
        setRelated([]);
      });
    return () => {
      alive = false;
    };
  }, [d]);

  if (loading && !d) {
    return (
      <div className="bg-stone-50">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-stone-600">Đang tải chi tiết...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-stone-50">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <Link to="/services" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-stone-700 hover:text-stone-900">
            <ArrowLeft size={14} />
            DANH SÁCH DỊCH VỤ
          </Link>
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{String(err)}</div>
        </div>
      </div>
    );
  }

  if (!d) return null;

  const showGiaGoc = d.giaGoc != null && d.giaGoc > d.giaHienTai;
  const pct = calcDiscountPercent(d.giaGoc, d.giaHienTai ?? 0);

  return (
    <div className="bg-stone-50">
      {/* Breadcrumb */}
      <div className="bg-stone-100">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-4 text-xs font-semibold tracking-[0.14em] text-stone-600">
          <Link to="/" className="hover:text-stone-900">TRANG CHỦ</Link>
          <span className="text-stone-400">/</span>
          <Link to="/services" className="hover:text-stone-900">DỊCH VỤ</Link>
          {d.danhMucTen && (
            <>
              <span className="text-stone-400">/</span>
              <Link
                to={d.danhMucId ? `/services?danhMucId=${d.danhMucId}` : "/services"}
                className="hover:text-stone-900"
              >
                {d.danhMucTen.toUpperCase()}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Hero / chi tiết */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <button
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-stone-700 hover:text-stone-900"
          >
            <ArrowLeft size={14} />
            QUAY LẠI
          </button>

          <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={d.tenDichVu}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.slice(0, 8).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImage(src)}
                      className={
                        src === activeImage
                          ? "overflow-hidden rounded-2xl border-2 border-amber-700 bg-white"
                          : "overflow-hidden rounded-2xl border border-stone-200 bg-white hover:border-amber-600"
                      }
                      aria-label="Chọn ảnh"
                    >
                      <img src={src} alt="thumbnail" className="aspect-square w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.22em] text-amber-700">
                  {(d.danhMucTen ?? "DỊCH VỤ").toUpperCase()}
                </span>
                {pct != null && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Giảm {pct}%
                  </span>
                )}
                {!d.isActive && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                    Tạm ngừng
                  </span>
                )}
              </div>

              <h1 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-stone-800 md:text-5xl">
                {d.tenDichVu}
              </h1>
              <div className="mt-3 h-px w-16 bg-amber-600/70" />

              {d.moTaNgan && (
                <p className="mt-5 text-sm leading-7 text-stone-700">{d.moTaNgan}</p>
              )}

              {/* Giá */}
              <div className="mt-7 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.18em] text-stone-500">GIÁ DỊCH VỤ</div>
                    <div className="mt-2 flex items-baseline gap-3">
                      <div className="font-serif text-4xl text-stone-900">{formatVnd(d.giaHienTai ?? 0)}</div>
                      {showGiaGoc && (
                        <div className="text-sm text-stone-500 line-through">{formatVnd(d.giaGoc ?? 0)}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold tracking-[0.18em] text-stone-500">MÃ DỊCH VỤ</div>
                    <div className="mt-2 text-sm font-semibold text-stone-800">{d.maDichVu}</div>
                  </div>
                </div>

                {(d.apDungTu || d.apDungDen) && (
                  <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800 ring-1 ring-amber-200">
                    {d.apDungTu && <div>Áp dụng từ: {formatDateTime(d.apDungTu)}</div>}
                    {d.apDungDen && <div>Áp dụng đến: {formatDateTime(d.apDungDen)}</div>}
                  </div>
                )}
              </div>

              {/* Quick info */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-700">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.14em] text-stone-500">THỜI LƯỢNG</div>
                    <div className="text-sm font-semibold text-stone-900">
                      {d.thoiLuongPhut != null ? `${d.thoiLuongPhut} phút` : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-700">
                    <Tag size={16} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.14em] text-stone-500">SỐ BUỔI</div>
                    <div className="text-sm font-semibold text-stone-900">
                      {d.soBuoi != null ? String(d.soBuoi) : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-700">
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.14em] text-stone-500">HIỆU LỰC</div>
                    <div className="text-sm font-semibold text-stone-900">
                      {d.thoiGianHieuLucNgay != null ? `${d.thoiGianHieuLucNgay} ngày` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={`/booking?serviceId=${d.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-6 py-3 text-xs font-semibold tracking-[0.18em] text-white hover:bg-amber-800"
                >
                  <CalendarDays size={14} />
                  ĐẶT LỊCH NGAY
                </Link>
                <Link
                  to="/lien-he"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-xs font-semibold tracking-[0.18em] text-stone-800 hover:bg-stone-100"
                >
                  TƯ VẤN THÊM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description / liệu trình */}
      {(d.moTa || d.lieuTrinh) && (
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14 md:py-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              {d.moTa && (
                <div>
                  <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">VỀ DỊCH VỤ</div>
                  <h2 className="mt-3 font-serif text-2xl text-stone-800 md:text-3xl">Thông tin chi tiết</h2>
                  <div className="mx-0 mt-3 h-px w-16 bg-amber-600/70" />
                  <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-stone-700">{d.moTa}</div>
                </div>
              )}
              {d.lieuTrinh && (
                <div>
                  <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">LIỆU TRÌNH</div>
                  <h2 className="mt-3 font-serif text-2xl text-stone-800 md:text-3xl">Trải nghiệm tại DiemSuong</h2>
                  <div className="mx-0 mt-3 h-px w-16 bg-amber-600/70" />
                  <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-stone-700">{d.lieuTrinh}</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-stone-50">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">CÓ THỂ BẠN QUAN TÂM</div>
                <h3 className="mt-3 font-serif text-2xl text-stone-800 md:text-3xl">Dịch vụ cùng danh mục</h3>
              </div>
              <Link
                to={d.danhMucId ? `/services?danhMucId=${d.danhMucId}` : "/services"}
                className="text-xs font-semibold tracking-[0.18em] text-amber-700 hover:underline"
              >
                XEM TẤT CẢ
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/services/${r.id}`}
                  className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {r.hinhAnhChinh ? (
                    <img src={r.hinhAnhChinh} alt={r.tenDichVu} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  ) : (
                    <ImagePlaceholder />
                  )}
                  <div className="p-4">
                    <div className="text-[11px] font-semibold tracking-[0.18em] text-amber-700">
                      {(r.danhMucTen ?? "DỊCH VỤ").toUpperCase()}
                    </div>
                    <div className="mt-2 font-serif text-base leading-snug text-stone-800 group-hover:underline">
                      {r.tenDichVu}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-semibold text-stone-900">{formatVnd(r.giaHienTai ?? 0)}</span>
                      {r.thoiLuongPhut != null && (
                        <span className="text-xs text-stone-500">{r.thoiLuongPhut} phút</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
