import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { CalendarDays, ChevronDown, Menu, UserCircle, X } from "lucide-react";
import { danhMucApi } from "../../api/danhMucDichVu";
import { dvPublicApi } from "../../api/dichVuPublic";
import { useCustomerAuthStore } from "../store/auth";
import SpaChatWidget from "../components/SpaChatWidget";

// Cấu hình điểm liên hệ (sửa số/link tại đây)
const CONTACT = {
  brand: "DiemSuong SPA",
  hotline: "0938789246",
  bookingPath: "/booking",
  email: "diemsuong.spa@gmail.com",
  branches: [
    { name: "DiemSuong SPA — Onsen", phone: "093 8789246" },
    { name: "DiemSuong SPA — Garden", phone: "098 1789357" },
  ],
};

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

type ServiceCategory = { id: number; name: string };

function byName(a: ServiceCategory, b: ServiceCategory) {
  return a.name.localeCompare(b.name, "vi");
}

export default function CustomerLayout() {
  const location = useLocation();
  const isBooking = location.pathname.startsWith("/booking");

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const customer = useCustomerAuthStore((s) => s.user);
  const customerLogout = useCustomerAuthStore((s) => s.logout);

  // Đóng drawer khi đổi trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Khóa scroll body khi drawer mở
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const data = await danhMucApi.list();
        const cats = (Array.isArray(data) ? data : [])
          .filter((x) => x.isActive ?? true)
          .map((x) => ({ id: x.id, name: x.tenDanhMuc }))
          .sort(byName);
        if (!alive) return;
        setServiceCategories(cats);
        return;
      } catch {
        // fallback bên dưới
      }

      try {
        const rows = await dvPublicApi.list();
        const map = new Map<number, string>();
        for (const r of rows) {
          if (r.danhMucId == null) continue;
          const name = (r.danhMucTen ?? "").trim();
          if (!name) continue;
          if (!map.has(r.danhMucId)) map.set(r.danhMucId, name);
        }
        const cats = Array.from(map.entries())
          .map(([id, name]) => ({ id, name }))
          .sort(byName);
        if (!alive) return;
        setServiceCategories(cats);
      } catch {
        // Nếu fail cả 2 thì dropdown chỉ hiện "TẤT CẢ"
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const from = useMemo(() => location.pathname + location.search, [location.pathname, location.search]);

  return (
    <div className={isBooking ? "min-h-screen bg-slate-800 text-white" : "min-h-screen bg-stone-50 text-stone-900"}>
      <header
        className={
          isBooking
            ? "sticky top-0 z-20 border-b border-slate-700/70 bg-slate-800/90 backdrop-blur"
            : "sticky top-0 z-20 border-b border-stone-200/70 bg-stone-50/85 backdrop-blur"
        }
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu"
            className={
              isBooking
                ? "rounded-lg p-2 -ml-2 text-white hover:bg-white/10 md:hidden"
                : "rounded-lg p-2 -ml-2 text-stone-800 hover:bg-stone-100 md:hidden"
            }
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight">
              <span className="italic text-amber-700">DiemSuong</span>
              <span className={isBooking ? "ml-1 text-white/70" : "ml-1 text-stone-600"}>SPA</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-semibold tracking-[0.18em] md:flex">
            <Link to="/" className={isBooking ? "py-2 hover:text-white" : "py-2 hover:text-stone-700"}>
              TRANG CHỦ
            </Link>

            <Link
              to="/gioi-thieu"
              className={isBooking ? "py-2 hover:text-white" : "py-2 hover:text-stone-700"}
            >
              GIỚI THIỆU
            </Link>

            <div className="group relative">
              <Link
                to="/services"
                className={
                  isBooking
                    ? "inline-flex items-center gap-1 py-2 hover:text-white"
                    : "inline-flex items-center gap-1 py-2 hover:text-stone-700"
                }
              >
                DỊCH VỤ
                <ChevronDown size={14} className="mt-0.5" />
              </Link>

              <div className="absolute left-1/2 top-full hidden w-[320px] -translate-x-1/2 pt-3 group-hover:block">
                <div className="max-h-[420px] overflow-auto rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                  <div className="grid gap-1">
                    <Link
                      to="/services"
                      className="rounded-xl px-3 py-2 text-[11px] font-semibold tracking-[0.14em] text-stone-800 hover:bg-stone-50"
                    >
                      TẤT CẢ
                    </Link>

                    {serviceCategories.map((c) => (
                      <Link
                        key={c.id}
                        to={`/services?danhMucId=${c.id}`}
                        className="rounded-xl px-3 py-2 text-[11px] font-semibold tracking-[0.14em] text-stone-800 hover:bg-stone-50"
                      >
                        {c.name.toUpperCase()}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/blog"
              className={isBooking ? "py-2 hover:text-white" : "py-2 hover:text-stone-700"}
            >
              BLOG
            </Link>

            <Link
              to="/lien-he"
              className={isBooking ? "py-2 hover:text-white" : "py-2 hover:text-stone-700"}
            >
              LIÊN HỆ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {customer ? (
              <Link
                to="/profile"
                aria-label="Trang ca nhan"
                title="Trang ca nhan"
                className={
                  isBooking
                    ? "grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-white/25 bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
                    : "grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-100"
                }
              >
                {initials(customer.fullName || customer.email)}
              </Link>
            ) : (
              <Link
                to="/customer-login"
                aria-label="Dang nhap"
                title="Dang nhap"
                className={isBooking ? "rounded-full p-2 text-white hover:bg-white/10" : "rounded-full p-2 text-stone-700 hover:bg-stone-100"}
              >
                <UserCircle size={20} />
              </Link>
            )}

            <Link
              to={CONTACT.bookingPath}
              state={{ from }}
              aria-label="Đặt lịch"
              className={
                isBooking
                  ? "inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-white hover:bg-white/10 sm:px-4"
                  : "inline-flex items-center gap-2 rounded-full bg-amber-700 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-white hover:bg-amber-800 sm:px-4"
              }
            >
              <CalendarDays size={14} />
              <span className="hidden sm:inline">ĐẶT LỊCH</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-stone-50 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <Link to="/" className="font-serif text-xl tracking-tight text-stone-800" onClick={() => setMobileMenuOpen(false)}>
                <span className="italic text-amber-700">DiemSuong</span>
                <span className="ml-1 text-stone-600">SPA</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
                className="rounded-lg p-2 text-stone-700 hover:bg-stone-200"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col px-3 py-3 text-sm font-semibold tracking-[0.16em] text-stone-800">
              <Link to="/" className="rounded-xl px-3 py-3 hover:bg-stone-100">TRANG CHỦ</Link>
              <Link to="/gioi-thieu" className="rounded-xl px-3 py-3 hover:bg-stone-100">GIỚI THIỆU</Link>
              <Link to="/services" className="rounded-xl px-3 py-3 hover:bg-stone-100">DỊCH VỤ</Link>

              {serviceCategories.length > 0 && (
                <div className="ml-3 mt-1 mb-2 flex flex-col border-l border-stone-200 pl-3">
                  {serviceCategories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/services?danhMucId=${c.id}`}
                      className="rounded-lg px-3 py-2 text-[11px] tracking-[0.14em] text-stone-700 hover:bg-stone-100"
                    >
                      {c.name.toUpperCase()}
                    </Link>
                  ))}
                </div>
              )}

              <Link to="/blog" className="rounded-xl px-3 py-3 hover:bg-stone-100">BLOG</Link>
              <Link to="/lien-he" className="rounded-xl px-3 py-3 hover:bg-stone-100">LIÊN HỆ</Link>
              {customer ? (
                <>
                  <Link to="/profile" className="rounded-xl px-3 py-3 hover:bg-stone-100">TRANG CA NHAN</Link>
                  <button
                    type="button"
                    onClick={customerLogout}
                    className="rounded-xl px-3 py-3 text-left hover:bg-stone-100"
                  >
                    DANG XUAT
                  </button>
                </>
              ) : (
                <Link to="/customer-login" className="rounded-xl px-3 py-3 hover:bg-stone-100">DANG NHAP</Link>
              )}
            </nav>

            <div className="px-5 pb-6 pt-2">
              <Link
                to={CONTACT.bookingPath}
                state={{ from }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-700 px-4 py-2.5 text-xs font-semibold tracking-[0.18em] text-white hover:bg-amber-800"
              >
                <CalendarDays size={14} />
                ĐẶT LỊCH NGAY
              </Link>
              <div className="mt-4 text-xs text-stone-500">
                Hotline:{" "}
                <a href={`tel:${CONTACT.hotline}`} className="font-semibold text-stone-700 hover:underline">
                  {CONTACT.hotline}
                </a>
              </div>
            </div>
          </aside>
        </div>
      )}

      <main>
        <Outlet />
      </main>

      {!isBooking && (
        <>
          <footer className="mt-12 bg-stone-100 text-stone-700">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-4">
              <div>
                <Link to="/" className="inline-flex items-center gap-2">
                  <span className="font-serif text-3xl tracking-tight text-stone-700">
                    <span className="italic text-amber-700">DiemSuong</span>
                    <span className="ml-1 text-stone-600">SPA</span>
                  </span>
                </Link>
                <div className="mt-8 text-xs text-stone-500">© 2026 DiemSuong SPA</div>
              </div>

              <div>
                <div className="text-xs font-semibold tracking-[0.18em] text-stone-800">
                  LIÊN KẾT NHANH
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  <li><Link to="/" className="hover:text-stone-900">Trang chủ</Link></li>
                  <li><Link to="/gioi-thieu" className="hover:text-stone-900">Giới thiệu</Link></li>
                  <li><Link to="/blog" className="hover:text-stone-900">Tin tức</Link></li>
                  <li><Link to="/lien-he" className="hover:text-stone-900">Liên hệ</Link></li>
                </ul>
              </div>

              <div>
                <div className="text-xs font-semibold tracking-[0.18em] text-stone-800">
                  CÁC DỊCH VỤ
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  <li><Link to="/services" className="hover:text-stone-900">Trọn gói</Link></li>
                  {serviceCategories.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <Link to={`/services?danhMucId=${c.id}`} className="hover:text-stone-900">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  <li><Link to="/services" className="hover:text-stone-900">Dịch vụ khác</Link></li>
                </ul>
              </div>

              <div>
                <div className="text-xs font-semibold tracking-[0.18em] text-stone-800">
                  THÔNG TIN LIÊN HỆ
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {CONTACT.branches.map((b) => (
                    <li key={b.name}>
                      {b.name}:{" "}
                      <a href={`tel:${b.phone.replace(/\s+/g, "")}`} className="font-semibold text-stone-800 hover:underline">
                        {b.phone}
                      </a>
                    </li>
                  ))}
                  <li>
                    Email:{" "}
                    <a href={`mailto:${CONTACT.email}`} className="font-semibold text-stone-800 hover:underline">
                      {CONTACT.email}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </footer>

          <SpaChatWidget />
        </>
      )}
    </div>
  );
}
