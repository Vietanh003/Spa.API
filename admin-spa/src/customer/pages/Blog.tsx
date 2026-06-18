import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { baiVietPublicApi, type BaiVietPublicRow } from "../../api/baiViet";
import { BLOG_POSTS } from "../data/blogPosts";

type Card = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMinutes: number | null;
  cover: string | null;
};

function formatDate(iso: string) {
  const dt = new Date(iso);
  if (!Number.isFinite(dt.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(dt);
  } catch {
    return iso;
  }
}

function fromApi(p: BaiVietPublicRow): Card {
  return {
    slug: p.slug,
    title: p.tieuDe,
    excerpt: p.moTaNgan ?? "",
    category: p.danhMuc ?? "Tin tức",
    date: p.ngayDang,
    readMinutes: p.thoiGianDocPhut ?? null,
    cover: p.anhBia,
  };
}

function fromMock(p: (typeof BLOG_POSTS)[number]): Card {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    date: p.date,
    readMinutes: p.readMinutes,
    cover: p.cover,
  };
}

function Cover({ card, className }: { card: Card; className: string }) {
  if (card.cover) {
    return <img src={card.cover} alt={card.title} className={`${className} object-cover`} loading="lazy" />;
  }
  return <div className={`${className} bg-gradient-to-br from-amber-100 via-stone-200 to-stone-300`} aria-hidden="true" />;
}

export default function CustomerBlog() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    baiVietPublicApi
      .list({ take: 50 })
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        if (list.length === 0) {
          // Fallback dữ liệu mock khi backend chưa có bài nào
          setCards([...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date)).map(fromMock));
        } else {
          setCards(list.map(fromApi));
        }
      })
      .catch(() => {
        if (!alive) return;
        // Fallback mock nếu lỗi API
        setCards([...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date)).map(fromMock));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const [featured, ...rest] = cards;

  return (
    <div className="bg-stone-50">
      <section className="bg-stone-100">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
          <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">CHUYỆN NHÀ SẢ</div>
          <h1 className="mt-4 font-serif text-4xl tracking-tight text-stone-800 md:text-5xl">Blog</h1>
          <div className="mx-auto mt-4 h-px w-20 bg-amber-600/70" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-stone-700">
            Những ghi chép nhỏ về chăm sóc cơ thể, tinh dầu, liệu trình và đôi điều dành riêng cho người
            đang đi tìm một nhịp nghỉ vừa vặn.
          </p>
        </div>
      </section>

      {loading && cards.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 py-20 text-center text-sm text-stone-600">Đang tải bài viết...</div>
      )}

      {featured && (
        <section className="bg-stone-50">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md md:grid-cols-2"
            >
              <Cover card={featured} className="aspect-[4/3] w-full md:aspect-auto md:h-full" />
              <div className="flex flex-col justify-center p-6 md:p-10">
                <div className="text-xs font-semibold tracking-[0.22em] text-amber-700">{featured.category.toUpperCase()}</div>
                <h2 className="mt-3 font-serif text-2xl leading-snug text-stone-800 md:text-3xl group-hover:underline">
                  {featured.title}
                </h2>
                {featured.excerpt && <p className="mt-4 text-sm leading-7 text-stone-700">{featured.excerpt}</p>}
                <div className="mt-6 text-xs text-stone-500">
                  {formatDate(featured.date)}
                  {featured.readMinutes != null && ` • ${featured.readMinutes} phút đọc`}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 pb-16 md:pb-20">
          <div className="mb-8 flex items-end justify-between">
            <h3 className="font-serif text-2xl text-stone-800 md:text-3xl">Tất cả bài viết</h3>
            <div className="text-xs text-stone-500">{rest.length} bài</div>
          </div>

          {rest.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-600">
              Chưa có bài viết nào khác.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <Cover card={p} className="aspect-[4/3] w-full" />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-[11px] font-semibold tracking-[0.18em] text-amber-700">{p.category.toUpperCase()}</div>
                    <h4 className="mt-2 font-serif text-lg leading-snug text-stone-800 group-hover:underline">{p.title}</h4>
                    {p.excerpt && <p className="mt-3 text-sm leading-6 text-stone-700 line-clamp-3">{p.excerpt}</p>}
                    <div className="mt-auto pt-4 text-xs text-stone-500">
                      {formatDate(p.date)}
                      {p.readMinutes != null && ` • ${p.readMinutes} phút đọc`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
