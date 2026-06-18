import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

function Img({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="aspect-[4/3] w-full bg-stone-200" aria-hidden="true" />;
  return <img src={src} alt={alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />;
}

export default function CustomerServices() {
  const nav = useNavigate();
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

  const selectedCategoryName = useMemo(() => {
    if (!danhMucId) return null;
    const name = (rows[0]?.danhMucTen ?? "").trim();
    return name || null;
  }, [danhMucId, rows]);

  return (
    <div>
      <section className="bg-stone-100">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <div className="text-center">
            <div className="text-2xl font-bold tracking-wide text-stone-800">DỊCH VỤ</div>
            <div className="mx-auto mt-4 h-px w-24 bg-amber-500/80" />
            {selectedCategoryName && (
              <div className="mt-3 text-xs font-semibold tracking-[0.18em] text-stone-600">
                {selectedCategoryName.toUpperCase()}
              </div>
            )}
          </div>

          {err && (
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {String(err)}
            </div>
          )}
        </div>
      </section>

      <section className="bg-stone-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          {loading && rows.length === 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden border border-white/10 bg-stone-600">
                  <div className="aspect-[4/3] w-full bg-white/10" />
                  <div className="h-10 bg-amber-500/80" />
                </div>
              ))}
            </div>
          )}

          {!loading && !err && rows.length === 0 && (
            <div className="rounded-xl border border-white/15 bg-white/10 p-6 text-center text-sm text-white/90">
              Chưa có dịch vụ hiển thị.
            </div>
          )}

          {rows.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => (
                <Link
                  key={r.id}
                  to={`/services/${r.id}`}
                  className="group relative overflow-hidden border border-white/10 bg-stone-600"
                >
                  <Img src={r.hinhAnhChinh} alt={r.tenDichVu} />

                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />

                  <div className="absolute bottom-0 left-0 right-0 bg-amber-500 px-4 py-2 text-center text-xs font-bold tracking-[0.14em] text-stone-900">
                    {r.tenDichVu.toUpperCase()}
                  </div>

                  <button
                    type="button"
                    className="absolute right-3 top-3 rounded-full border border-white/35 bg-black/35 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      nav(`/booking?serviceId=${r.id}`);
                    }}
                  >
                    ĐẶT LỊCH
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
