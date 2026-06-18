import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { type DichVuDetail } from "../../api/dichVu";
import { dvPublicApi, type DichVuPublicRow } from "../../api/dichVuPublic";
import { lichHenApi, type LichHenAvailabilityDay } from "../../api/lichHen";
import { formatVnd } from "../lib/format";
import { useCustomerAuthStore } from "../store/auth";

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

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayISO() {
  return isoDate(new Date());
}

const WEEKDAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDayChip(d: Date) {
  return {
    wd: WEEKDAYS_VI[d.getDay()],
    dd: String(d.getDate()).padStart(2, "0"),
    mm: String(d.getMonth() + 1).padStart(2, "0"),
  };
}

const SLOT_MINUTES = 60;
const DAYS = 7;

export default function CustomerBooking() {
  const nav = useNavigate();
  const customer = useCustomerAuthStore((s) => s.user);
  const [sp] = useSearchParams();
  const serviceIdFromQuery = sp.get("serviceId") ?? "";

  // Catalog
  const [services, setServices] = useState<DichVuPublicRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);

  // Selection
  const [danhMucId, setDanhMucId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>(serviceIdFromQuery);
  const [service, setService] = useState<DichVuDetail | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);

  // Date / time
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("");

  // Availability
  const [availability, setAvailability] = useState<LichHenAvailabilityDay[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availErr, setAvailErr] = useState<string | null>(null);

  // Customer info
  const [phone, setPhone] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [ghiChu, setGhiChu] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    setFullName((current) => current || customer.fullName || customer.email);
  }, [customer]);

  // 7 ngày của tuần này (bắt đầu từ hôm nay)
  const weekDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  // Tải catalog dịch vụ public
  useEffect(() => {
    let alive = true;
    setCatalogLoading(true);
    setCatalogErr(null);
    dvPublicApi
      .list()
      .then((data) => {
        if (!alive) return;
        const items = (Array.isArray(data) ? data : []).filter((x) => x.isOnlineVisible ?? true);
        setServices(items);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setCatalogErr(getErrorText(e, "Không tải được danh sách dịch vụ"));
      })
      .finally(() => {
        if (!alive) return;
        setCatalogLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Khi catalog load xong, tự khớp danh mục theo serviceId (nếu có)
  useEffect(() => {
    if (!serviceId || services.length === 0) return;
    const found = services.find((x) => String(x.id) === String(serviceId));
    if (found && found.danhMucId != null) {
      setDanhMucId(String(found.danhMucId));
    }
  }, [serviceId, services]);

  // Danh sách danh mục từ services
  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of services) {
      if (s.danhMucId == null) continue;
      const name = (s.danhMucTen ?? "").trim();
      if (!name) continue;
      if (!map.has(s.danhMucId)) map.set(s.danhMucId, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [services]);

  // Danh sách dịch vụ theo danh mục đã chọn (rỗng => tất cả)
  const filteredServices = useMemo(() => {
    if (!danhMucId) return services;
    const id = Number(danhMucId);
    return services.filter((s) => s.danhMucId === id);
  }, [services, danhMucId]);

  // Tải chi tiết dịch vụ khi chọn
  useEffect(() => {
    if (!serviceId) {
      setService(null);
      return;
    }
    const id = Number(serviceId);
    if (!Number.isFinite(id)) {
      setService(null);
      return;
    }
    let alive = true;
    setServiceLoading(true);
    dvPublicApi
      .get(id)
      .then((d) => {
        if (!alive) return;
        setService(d);
      })
      .catch(() => {
        if (!alive) return;
        setService(null);
      })
      .finally(() => {
        if (!alive) return;
        setServiceLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [serviceId]);

  // Tải khung giờ trống (60 phút / 7 ngày)
  useEffect(() => {
    let alive = true;
    setAvailLoading(true);
    setAvailErr(null);
    lichHenApi
      .available({ from: todayISO(), days: DAYS, slotMinutes: SLOT_MINUTES })
      .then((data) => {
        if (!alive) return;
        setAvailability(Array.isArray(data) ? data : []);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setAvailErr(getErrorText(e, "Không tải được khung giờ trống"));
        setAvailability([]);
      })
      .finally(() => {
        if (!alive) return;
        setAvailLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const daySlots = useMemo(() => {
    const found = availability.find((x) => x?.date === date);
    const slots = found?.slots ?? [];
    return slots
      .map((s) => String(s))
      .map((s) => (s.length >= 5 ? s.slice(0, 5) : s))
      .filter((s) => /^\d{2}:\d{2}$/.test(s));
  }, [availability, date]);

  // Reset time nếu đổi ngày mà slot không còn
  useEffect(() => {
    if (!time) return;
    if (daySlots.includes(time)) return;
    setTime("");
  }, [daySlots, time]);

  // Đổi danh mục → clear service (nếu service hiện tại không thuộc danh mục)
  function onChangeCategory(v: string) {
    setDanhMucId(v);
    if (!v) return;
    const id = Number(v);
    if (serviceId) {
      const s = services.find((x) => String(x.id) === serviceId);
      if (!s || s.danhMucId !== id) setServiceId("");
    }
  }

  function onSubmit() {
    setErr(null);

    if (!customer) {
      nav("/customer-login", { replace: true });
      return;
    }

    if (!phone.trim()) return setErr("Vui lòng nhập số điện thoại");
    if (!fullName.trim()) return setErr("Vui lòng nhập họ và tên");
    if (!serviceId) return setErr("Vui lòng chọn dịch vụ");
    if (!date) return setErr("Vui lòng chọn ngày");
    if (!time) return setErr("Vui lòng chọn khung giờ trống");
    if (!daySlots.includes(time)) return setErr("Giờ đã chọn không còn trống. Vui lòng chọn lại.");

    const payload = {
      hoTenKhach: fullName.trim(),
      dienThoaiKhach: phone.trim(),
      emailKhach: customer.email,
      ngayHen: date,
      gioHen: time.length === 5 ? `${time}:00` : time,
      dichVuId: Number(serviceId),
      thoiLuongDuKien: service?.thoiLuongPhut ?? SLOT_MINUTES,
      ghiChuKhach: ghiChu.trim() === "" ? undefined : ghiChu.trim(),
    };

    setSubmitting(true);
    lichHenApi
      .create(payload)
      .then(() => {
        alert("Đặt lịch thành công. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.");
        nav("/profile", { replace: true });
      })
      .catch((e: unknown) => {
        setErr(getErrorText(e, "Không thể đặt lịch"));
      })
      .finally(() => setSubmitting(false));
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/30";

  return (
    <div className="bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl tracking-tight text-stone-800 md:text-4xl">Đặt lịch</h1>
          <Link to="/" className="text-sm font-medium text-stone-700 hover:text-stone-900 hover:underline">
            Về trang chủ
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: form */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
            <div className="text-sm font-semibold text-stone-900">Thông tin khách hàng</div>
            <div className="mt-1 text-xs text-stone-500">
              <span className="text-rose-600">(*)</span> Vui lòng nhập thông tin bắt buộc
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-semibold text-stone-800">
                  Số điện thoại <span className="text-rose-600">*</span>
                </span>
                <input
                  className={inputClass}
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                />
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-stone-800">
                  Họ và tên <span className="text-rose-600">*</span>
                </span>
                <input
                  className={inputClass}
                  placeholder="Họ và tên khách hàng"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label className="block text-sm md:col-span-2">
                <span className="font-semibold text-stone-800">Ghi chú</span>
                <input
                  className={inputClass}
                  placeholder="Ghi chú thêm (nếu có)"
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-8 text-sm font-semibold text-stone-900">Chọn dịch vụ</div>
            <div className="mt-1 text-xs text-stone-500">Chọn danh mục, sau đó chọn dịch vụ bạn muốn đặt.</div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-semibold text-stone-800">Danh mục</span>
                <select
                  className={inputClass}
                  value={danhMucId}
                  onChange={(e) => onChangeCategory(e.target.value)}
                  disabled={catalogLoading}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-stone-800">
                  Dịch vụ <span className="text-rose-600">*</span>
                </span>
                <select
                  className={inputClass}
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  disabled={catalogLoading || filteredServices.length === 0}
                >
                  <option value="">
                    {catalogLoading
                      ? "Đang tải..."
                      : filteredServices.length === 0
                      ? "Không có dịch vụ"
                      : "-- Chọn dịch vụ --"}
                  </option>
                  {filteredServices.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.tenDichVu} ({formatVnd(s.giaHienTai ?? 0)})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {catalogErr && (
              <div className="mt-3 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {catalogErr}
              </div>
            )}

            <div className="mt-8 text-sm font-semibold text-stone-900">
              Ngày đặt lịch <span className="text-rose-600">*</span>
            </div>
            <div className="mt-1 text-xs text-stone-500">Chỉ đặt được trong vòng 7 ngày kể từ hôm nay.</div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
              {weekDays.map((d) => {
                const iso = isoDate(d);
                const isActive = iso === date;
                const chip = formatDayChip(d);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setDate(iso)}
                    className={
                      isActive
                        ? "rounded-xl border border-amber-700 bg-amber-700 px-3 py-3 text-center text-white shadow-sm"
                        : "rounded-xl border border-stone-300 bg-white px-3 py-3 text-center text-stone-800 hover:border-amber-600 hover:bg-amber-50"
                    }
                  >
                    <div className="text-[11px] font-semibold tracking-[0.14em]">{chip.wd}</div>
                    <div className="mt-1 text-lg font-semibold">{chip.dd}</div>
                    <div className="text-[11px] opacity-80">Th{Number(chip.mm)}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 text-sm font-semibold text-stone-900">
              Chọn khung giờ <span className="text-rose-600">*</span>
            </div>
            <div className="mt-1 text-xs text-stone-500">Mỗi khung cách nhau 60 phút.</div>

            <div className="mt-3 rounded-md bg-stone-50 px-4 py-2.5 text-sm text-stone-700 ring-1 ring-stone-200">
              {availLoading
                ? "Đang tải khung giờ..."
                : daySlots.length > 0
                ? "Vui lòng chọn một khung giờ trống bên dưới"
                : "Không còn khung giờ trống cho ngày đã chọn"}
            </div>

            {availErr && (
              <div className="mt-3 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {availErr}
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {daySlots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={
                    time === s
                      ? "rounded-lg border border-amber-700 bg-amber-700 px-3 py-2.5 text-sm font-semibold text-white"
                      : "rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 hover:border-amber-600 hover:bg-amber-50"
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            {err && (
              <div className="mt-6 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {String(err)}
              </div>
            )}

            <div className="mt-8 text-xs text-stone-600">
              Khi bấm <span className="font-semibold">&quot;Đặt lịch&quot;</span> nghĩa là bạn đồng ý với{" "}
              <a href="#" className="font-medium text-amber-700 hover:underline" onClick={(e) => e.preventDefault()}>
                Chính sách bảo vệ dữ liệu cá nhân
              </a>
              .
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting || availLoading || catalogLoading}
              className="mt-4 w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {submitting ? "ĐANG ĐẶT..." : "ĐẶT LỊCH"}
            </button>
          </div>

          {/* Right: summary */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-stone-900">Tóm tắt</div>
              <div className="mt-3 space-y-2 text-sm text-stone-700">
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Dịch vụ</span>
                  <span className="text-right font-semibold text-stone-900">
                    {serviceLoading
                      ? "..."
                      : service
                      ? service.tenDichVu
                      : "Chưa chọn"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Danh mục</span>
                  <span className="text-right text-stone-800">{service?.danhMucTen ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Thời lượng</span>
                  <span className="text-right text-stone-800">
                    {service?.thoiLuongPhut != null ? `${service.thoiLuongPhut} phút` : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Giá</span>
                  <span className="text-right font-semibold text-stone-900">
                    {service ? formatVnd(service.giaHienTai ?? 0) : "—"}
                  </span>
                </div>
                <div className="border-t pt-2" />
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Ngày</span>
                  <span className="text-right text-stone-800">{date}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Giờ</span>
                  <span className="text-right text-stone-800">{time || "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-stone-900">DiemSuong SPA</div>
              <div className="mt-2 text-sm text-stone-700">
                Hotline:{" "}
                <a href="tel:0938789246" className="font-semibold text-stone-900 hover:underline">
                  093 878 9246
                </a>
              </div>
              <div className="mt-1 text-xs text-stone-500">Giờ mở cửa: 09:00 - 22:30</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
