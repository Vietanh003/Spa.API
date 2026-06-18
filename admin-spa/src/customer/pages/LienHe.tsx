import { useState, type FormEvent } from "react";
import { lienHeApi } from "../../api/lienHe";

function getErrorText(e: unknown, fallback: string) {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const maybe = e as { message?: unknown; response?: { data?: unknown } };
    const data = maybe.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const d = data as { message?: unknown };
      if (typeof d.message === "string") return d.message;
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

export default function CustomerLienHe() {
  const [hoTen, setHoTen] = useState("");
  const [dienThoai, setDienThoai] = useState("");
  const [email, setEmail] = useState("");
  const [loiNhan, setLoiNhan] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErr(null);
    setOk(null);

    const ht = hoTen.trim();
    const dt = dienThoai.trim();
    const ln = loiNhan.trim();

    if (!ht) return setErr("Vui lòng nhập tên của bạn.");
    if (!dt) return setErr("Vui lòng nhập số điện thoại.");
    if (!ln) return setErr("Vui lòng nhập lời nhắn.");

    setSubmitting(true);
    try {
      const res = await lienHeApi.submit({
        hoTen: ht,
        dienThoai: dt,
        email: email.trim() === "" ? null : email.trim(),
        loiNhan: ln,
      });
      setOk(res.message || "Đã gửi tin nhắn. Chúng tôi sẽ liên hệ trong thời gian sớm nhất.");
      setHoTen("");
      setDienThoai("");
      setEmail("");
      setLoiNhan("");
    } catch (ex: unknown) {
      setErr(getErrorText(ex, "Gửi tin nhắn thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/30";

  return (
    <div className="bg-stone-50">
      {/* Hero */}
      <section className="bg-stone-100">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 text-center">
          <h1 className="font-serif text-4xl tracking-tight text-stone-800 md:text-5xl">Liên hệ</h1>
          <div className="mx-auto mt-4 h-px w-24 bg-amber-600/70" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-stone-700">
            Vui lòng để lại thông tin, chúng tôi sẽ phản hồi trong thời gian sớm nhất.
          </p>
        </div>
      </section>

      {/* Form nhắn tin */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-3xl px-4 py-14 md:py-16">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-10">
            <h2 className="text-center font-serif text-3xl text-stone-800 md:text-4xl">
              Gửi tin nhắn cho chúng tôi
            </h2>
            <div className="mx-auto mt-3 h-px w-16 bg-amber-600/70" />

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="font-semibold text-stone-800">
                    Tên của bạn <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Nhập tên của bạn"
                    value={hoTen}
                    onChange={(e) => setHoTen(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-stone-800">
                    SĐT <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="SĐT của bạn"
                    value={dienThoai}
                    onChange={(e) => setDienThoai(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-stone-800">Email</span>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="Nhập địa chỉ email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="font-semibold text-stone-800">
                  Lời nhắn <span className="text-rose-600">*</span>
                </span>
                <textarea
                  rows={6}
                  className={inputClass}
                  placeholder="Nhập nội dung vào đây nhé!"
                  value={loiNhan}
                  onChange={(e) => setLoiNhan(e.target.value)}
                  required
                  disabled={submitting}
                />
              </label>

              {err && (
                <div className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                  {String(err)}
                </div>
              )}
              {ok && (
                <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                  {ok}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-amber-700 px-6 py-3 text-sm font-semibold tracking-[0.18em] text-white hover:bg-amber-800 disabled:opacity-60"
              >
                {submitting ? "ĐANG GỬI..." : "GỬI"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
