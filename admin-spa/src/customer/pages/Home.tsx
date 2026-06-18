import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { dvPublicApi, type DichVuPublicRow } from "../../api/dichVuPublic";

function getErrorText(e: unknown, fallback: string) {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const maybe = e as { message?: unknown; response?: { data?: unknown } };
    const data = maybe.response?.data;
    if (typeof data === "string") return data;
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

function Img({
  src,
  alt,
  className,
  fallbackSrc,
}: {
  src?: string | null;
  alt: string;
  className: string;
  fallbackSrc?: string | null;
}) {
  if (!src) return <div className={className + " bg-stone-200"} aria-hidden="true" />;
  return (
    <img
      src={src}
      alt={alt}
      className={className + " object-cover"}
      loading="lazy"
      onError={(e) => {
        if (!fallbackSrc) return;
        const img = e.currentTarget;
        img.onerror = null;
        img.src = fallbackSrc;
      }}
    />
  );
}

export default function CustomerHome() {
  const nav = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();
  const [rows, setRows] = useState<DichVuPublicRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const danhMucId = useMemo(() => {
    const raw = sp.get("danhMucId");
    if (!raw) return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    if (!(n > 0)) return undefined;
    return n;
  }, [sp]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    dvPublicApi
      .list({ danhMucId })
      .then((data) => {
        if (!alive) return;
        setRows((Array.isArray(data) ? data : []).filter((x) => x.isOnlineVisible ?? true));
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setErr(getErrorText(e, "Không tải được danh sách dịch vụ"));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [danhMucId]);

  useEffect(() => {
    if (location.hash !== "#services") return;
    const el = document.getElementById("services");
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => clearTimeout(t);
  }, [location.hash, danhMucId]);

  const featured = useMemo(() => (danhMucId ? rows : rows.slice(0, 7)), [rows, danhMucId]);
  const heroImage = featured.find((x) => (x.hinhAnhChinh ?? "").trim())?.hinhAnhChinh ?? null;
  const heroImageFixed = "/Image/Gemini_Generated_Image_boedl3boedl3boed.png";

  const collage = useMemo(() => {
    const imgs = featured.map((x) => x.hinhAnhChinh).filter(Boolean) as string[];
    return {
      small1: imgs[0] ?? null,
      small2: imgs[1] ?? null,
      large: imgs[2] ?? null,
    };
  }, [featured]);

  const top3 = useMemo(() => featured.slice(0, 3), [featured]);
  const rest = useMemo(() => featured.slice(3), [featured]);

  const selectedCategoryName = useMemo(() => {
    if (!danhMucId) return null;
    const name = (rows[0]?.danhMucTen ?? "").trim();
    return name || null;
  }, [danhMucId, rows]);

  return (
    <div>
      {/* 1) Hero */}
      <section className="bg-stone-100">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="text-center md:text-left">
            <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">DIEMSUONG SPA</div>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-stone-800 sm:text-5xl md:mx-0 md:text-6xl">
              Chăm sóc tinh tế, thư giãn trọn vẹn
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-stone-700 md:mx-0">
              Không gian riêng tư, liệu trình chuẩn hoá và đội ngũ kỹ thuật viên tận tâm — mang đến cho bạn một khoảng nghỉ thật sự.
            </p>
          </div>

          <div className="overflow-hidden rounded-[40px]">
            <Img
              src={heroImageFixed}
              fallbackSrc={heroImage}
              alt="Không gian spa"
              className="aspect-[4/5] w-full"
            />
          </div>
        </div>
      </section>

      {/* 3) About */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">VỀ CHÚNG TÔI</div>
            <h2 className="mt-3 font-serif text-3xl text-stone-800 md:text-4xl">DiemSuong SPA</h2>
            <div className="mx-0 mt-3 h-px w-16 bg-amber-600/70" />
            <div className="mt-6 space-y-4 text-sm leading-7 text-stone-700">
              <p>
                Chuyên cung cấp dịch vụ massage, chăm sóc da và liệu trình thư giãn cao cấp tại TP.HCM.
              </p>
              <p>
                Quy trình chuẩn hoá, không gian riêng tư và kỹ thuật viên được đào tạo bài bản — cam kết một trải nghiệm an toàn, dễ chịu trong mỗi lần ghé thăm.
              </p>
            </div>

            <button
              type="button"
              className="mt-8 inline-flex items-center justify-center rounded-full border border-amber-600/60 px-6 py-2.5 text-xs font-semibold tracking-[0.14em] text-amber-700 hover:bg-amber-50"
              onClick={() => {
                document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              XEM THÊM
            </button>

            {err && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {String(err)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-3xl">
                <Img src={collage.small1} alt="Ảnh spa" className="aspect-[4/3] w-full" />
              </div>
              <div className="overflow-hidden rounded-3xl">
                <Img src={collage.small2} alt="Ảnh spa" className="aspect-[4/3] w-full" />
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl">
              <Img src={collage.large} alt="Ảnh spa" className="aspect-[3/4] w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 4) Services */}
      <section id="services" className="bg-stone-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="text-center">
            <div className="text-2xl font-bold tracking-wide">DỊCH VỤ CỦA CHÚNG TÔI</div>
            <div className="mx-auto mt-4 h-px w-28 bg-amber-400/80" />
            {selectedCategoryName && (
              <div className="mt-3 text-xs font-semibold tracking-[0.18em] text-white/90">
                {selectedCategoryName.toUpperCase()}
              </div>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {top3.map((r, idx) => {
              const isFirst = idx === 0;
              return (
                <Link
                  key={r.id}
                  to={`/services/${r.id}`}
                  className="group relative overflow-hidden border border-white/10 bg-stone-600"
                >
                  <Img src={r.hinhAnhChinh} alt={r.tenDichVu} className="aspect-[4/3] w-full" />

                  {isFirst && (
                    <div className="absolute inset-0 grid place-items-center bg-black/45 px-6 text-center">
                      <div>
                        <div className="text-xs font-bold tracking-[0.18em]">{(r.danhMucTen ?? "MASSAGE").toUpperCase()}</div>
                        <div className="mt-2 text-xl font-bold tracking-wide md:text-2xl">{r.tenDichVu.toUpperCase()}</div>
                        {r.moTaNgan && (
                          <p className="mx-auto mt-3 max-w-sm text-xs leading-6 text-white/90">{r.moTaNgan}</p>
                        )}
                        <button
                          type="button"
                          className="mt-5 inline-flex items-center justify-center rounded-full border border-amber-300/70 px-6 py-2 text-xs font-semibold tracking-[0.14em] text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            nav(`/booking?serviceId=${r.id}`);
                          }}
                        >
                          ĐẶT LỊCH NGAY
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-amber-500 px-4 py-2 text-center text-xs font-bold tracking-[0.14em] text-stone-900">
                    {r.tenDichVu.toUpperCase()}
                  </div>
                </Link>
              );
            })}

            {loading && top3.length === 0 && (
              <div className="col-span-full grid grid-cols-1 gap-6 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] w-full bg-stone-600/60" />
                ))}
              </div>
            )}
          </div>

          {rest.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {rest.map((r) => (
                <Link
                  key={r.id}
                  to={`/services/${r.id}`}
                  className="group relative overflow-hidden border border-white/10 bg-stone-600"
                >
                  <Img src={r.hinhAnhChinh} alt={r.tenDichVu} className="aspect-[4/3] w-full" />
                  <div className="absolute bottom-0 left-0 right-0 bg-amber-500 px-2 py-2 text-center text-[11px] font-bold tracking-[0.14em] text-stone-900">
                    {r.tenDichVu.toUpperCase()}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !err && featured.length === 0 && (
            <div className="mt-10 rounded-xl border border-white/15 bg-white/10 p-6 text-center text-sm text-white/90">
              Chưa có dịch vụ hiển thị.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
