import { Link } from "react-router-dom";

const VALUES = [
  {
    title: "Thiên nhiên",
    body: "Tinh dầu và nguyên liệu chăm sóc tuyển chọn từ thiên nhiên — dịu nhẹ, lành tính.",
  },
  {
    title: "Cá nhân hoá",
    body: "Mỗi liệu trình được điều chỉnh theo thể trạng và nhu cầu của từng khách hàng.",
  },
  {
    title: "Tay nghề",
    body: "Đội ngũ kỹ thuật viên được đào tạo bài bản, thao tác chính xác và an toàn.",
  },
  {
    title: "Không gian",
    body: "Phòng riêng tĩnh lặng, ánh sáng dịu — giúp bạn thư giãn ngay từ phút đầu.",
  },
];

const STATS = [
  { value: "10+", label: "Năm hoạt động" },
  { value: "30K+", label: "Lượt khách" },
  { value: "20+", label: "Liệu trình" },
  { value: "2", label: "Chi nhánh TP.HCM" },
];

export default function CustomerGioiThieu() {
  return (
    <div className="bg-stone-50">
      {/* Hero */}
      <section className="bg-stone-100">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">GIỚI THIỆU</div>
            <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-stone-800 md:text-5xl">
              DiemSuong SPA
            </h1>
            <div className="mt-4 h-px w-16 bg-amber-600/70" />
            <p className="mt-6 max-w-xl text-sm leading-7 text-stone-700">
              Thương hiệu chăm sóc sức khoẻ và thư giãn tại TP.HCM, mang đến trải nghiệm spa chuẩn mực với quy trình rõ ràng và dịch vụ tận tâm.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="rounded-full bg-amber-700 px-6 py-2.5 text-xs font-semibold tracking-[0.18em] text-white hover:bg-amber-800"
              >
                ĐẶT LỊCH
              </Link>
              <Link
                to="/services"
                className="rounded-full border border-stone-300 px-6 py-2.5 text-xs font-semibold tracking-[0.18em] text-stone-800 hover:bg-white"
              >
                XEM DỊCH VỤ
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[36px] bg-stone-200">
            <div className="aspect-[4/5] w-full bg-gradient-to-br from-stone-300 via-stone-200 to-amber-100" />
          </div>
        </div>
      </section>

      {/* Câu chuyện */}
      <section className="bg-stone-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-[1.05fr_1fr] md:items-center md:py-20">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-stone-200 to-stone-300" />
              <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-stone-200" />
            </div>
            <div className="space-y-4 pt-10">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-stone-200 to-amber-100" />
              <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-stone-300 to-stone-200" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">VỀ CHÚNG TÔI</div>
            <h2 className="mt-3 font-serif text-3xl leading-snug text-stone-800 md:text-4xl">
              Một địa chỉ tin cậy cho người trân trọng sự cân bằng.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-stone-700">
              <p>
                DiemSuong SPA cung cấp dịch vụ massage, chăm sóc da và các liệu trình thư giãn chuyên sâu — tất cả được chuẩn hoá theo quy trình rõ ràng.
              </p>
              <p>
                Chúng tôi tin rằng chăm sóc cơ thể là một thói quen lành mạnh, không phải món xa xỉ. Mỗi buổi tại DiemSuong đều hướng đến sự an toàn, hiệu quả và thoải mái.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Giá trị */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">GIÁ TRỊ CỐT LÕI</div>
            <h2 className="mt-3 font-serif text-3xl text-stone-800 md:text-4xl">Bốn cam kết của chúng tôi</h2>
            <div className="mx-auto mt-4 h-px w-20 bg-amber-600/70" />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <div key={v.title} className="rounded-3xl border border-stone-200 bg-stone-50 p-6 transition hover:border-amber-600/50 hover:bg-white">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-700 font-serif text-sm font-semibold text-white">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-5 font-serif text-xl text-stone-800">{v.title}</div>
                <p className="mt-3 text-sm leading-7 text-stone-700">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="bg-stone-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-serif text-4xl text-amber-300 md:text-5xl">{s.value}</div>
                <div className="mt-3 text-xs font-semibold tracking-[0.18em] text-white/80">{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center md:flex-row md:justify-between md:text-left md:py-16">
          <div>
            <div className="font-serif text-2xl text-stone-800 md:text-3xl">Sẵn sàng dành cho mình một buổi nghỉ?</div>
            <p className="mt-2 max-w-xl text-sm text-stone-600">
              Đặt lịch ngay hôm nay — chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/booking"
              className="rounded-full bg-amber-700 px-6 py-2.5 text-xs font-semibold tracking-[0.18em] text-white hover:bg-amber-800"
            >
              ĐẶT LỊCH NGAY
            </Link>
            <Link
              to="/lien-he"
              className="rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold tracking-[0.18em] text-stone-800 hover:bg-stone-50"
            >
              LIÊN HỆ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
