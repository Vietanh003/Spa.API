import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { baiVietPublicApi, type BaiVietPublicDetail, type BaiVietPublicRow } from "../../api/baiViet";
import { BLOG_POSTS, getPostBySlug } from "../data/blogPosts";

type Detail = {
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  readMinutes: number | null;
  cover: string | null;
  videoUrl: string | null;
  bodyParagraphs: string[];
  bodyHtml: string | null;
};

function fromApi(d: BaiVietPublicDetail): Detail {
  const raw = d.noiDung ?? "";
  const looksLikeHtml = /<[^>]+>/.test(raw);
  return {
    slug: d.slug,
    title: d.tieuDe,
    category: d.danhMuc ?? "Tin tức",
    date: d.ngayDang,
    author: d.tacGia ?? "DiemSuong SPA",
    readMinutes: d.thoiGianDocPhut ?? null,
    cover: d.anhBia,
    videoUrl: d.videoUrl,
    bodyParagraphs: looksLikeHtml
      ? []
      : raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    bodyHtml: looksLikeHtml ? raw : null,
  };
}

function fromMock(p: (typeof BLOG_POSTS)[number]): Detail {
  return {
    slug: p.slug,
    title: p.title,
    category: p.category,
    date: p.date,
    author: p.author,
    readMinutes: p.readMinutes,
    cover: p.cover,
    videoUrl: null,
    bodyParagraphs: p.body,
    bodyHtml: null,
  };
}

function formatDate(iso: string) {
  const dt = new Date(iso);
  if (!Number.isFinite(dt.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(dt);
  } catch {
    return iso;
  }
}

function isInlineVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export default function CustomerBlogDetail() {
  const { slug = "" } = useParams();

  const [post, setPost] = useState<Detail | null>(null);
  const [related, setRelated] = useState<BaiVietPublicRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    baiVietPublicApi
      .getBySlug(slug)
      .then((data) => {
        if (!alive) return;
        setPost(fromApi(data));
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          // fallback mock
          const mock = getPostBySlug(slug);
          if (mock) setPost(fromMock(mock));
          else setNotFound(true);
        } else {
          // lỗi khác — vẫn thử mock
          const mock = getPostBySlug(slug);
          if (mock) setPost(fromMock(mock));
          else setNotFound(true);
        }
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    let alive = true;
    baiVietPublicApi
      .list({ take: 4 })
      .then((rows) => {
        if (!alive) return;
        setRelated((rows ?? []).filter((r) => r.slug !== post.slug).slice(0, 3));
      })
      .catch(() => {
        if (!alive) return;
        setRelated([]);
      });
    return () => {
      alive = false;
    };
  }, [post]);

  if (loading && !post) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-stone-600">Đang tải bài viết...</div>;
  }

  if (notFound || !post) {
    return (
      <div className="bg-stone-50">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-serif text-3xl text-stone-800">Bài viết không tồn tại</h1>
          <p className="mt-3 text-sm text-stone-600">Có thể bài viết đã được gỡ hoặc đường dẫn không đúng.</p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-700 px-5 py-2 text-xs font-semibold tracking-[0.18em] text-white hover:bg-amber-800"
          >
            <ArrowLeft size={14} />
            VỀ TRANG BLOG
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50">
      <section className="bg-stone-100">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center md:py-20">
          <Link to="/blog" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-stone-700 hover:text-stone-900">
            <ArrowLeft size={14} />
            BLOG
          </Link>
          <div className="mt-6 text-xs font-semibold tracking-[0.22em] text-amber-700">{post.category.toUpperCase()}</div>
          <h1 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-stone-800 md:text-5xl">{post.title}</h1>
          <div className="mt-5 text-xs text-stone-500">
            {formatDate(post.date)}
            {post.readMinutes != null && ` • ${post.readMinutes} phút đọc`}
            {post.author && ` • ${post.author}`}
          </div>
        </div>
      </section>

      <section className="bg-stone-50">
        <div className="mx-auto max-w-4xl px-4 pt-6">
          {post.cover ? (
            <img src={post.cover} alt={post.title} className="aspect-[16/9] w-full rounded-3xl object-cover" />
          ) : (
            <div className="aspect-[16/9] w-full rounded-3xl bg-gradient-to-br from-amber-100 via-stone-200 to-stone-300" />
          )}

          {post.videoUrl && (
            <div className="mt-6">
              {isInlineVideo(post.videoUrl) ? (
                <video src={post.videoUrl} controls className="aspect-video w-full rounded-3xl border border-stone-200" />
              ) : (
                <a
                  href={post.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold tracking-[0.18em] text-white hover:bg-stone-800"
                >
                  XEM VIDEO
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="bg-stone-50">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          {post.bodyHtml ? (
            <article
              className="prose prose-stone max-w-none text-base leading-8 text-stone-800"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          ) : (
            <article className="space-y-5 text-base leading-8 text-stone-800">
              {post.bodyParagraphs.map((p, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:text-amber-700 first-letter:float-left first-letter:mr-2 first-letter:leading-none"
                      : ""
                  }
                >
                  {p}
                </p>
              ))}
            </article>
          )}
        </div>
      </section>

      {related && related.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
            <div className="mb-8 flex items-end justify-between">
              <h3 className="font-serif text-2xl text-stone-800 md:text-3xl">Đọc thêm</h3>
              <Link to="/blog" className="text-xs font-semibold tracking-[0.18em] text-amber-700 hover:underline">XEM TẤT CẢ</Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 transition hover:bg-white hover:shadow-md"
                >
                  {p.anhBia ? (
                    <img src={p.anhBia} alt={p.tieuDe} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gradient-to-br from-amber-100 via-stone-200 to-stone-300" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-[11px] font-semibold tracking-[0.18em] text-amber-700">{(p.danhMuc ?? "Tin tức").toUpperCase()}</div>
                    <div className="mt-2 font-serif text-lg leading-snug text-stone-800 group-hover:underline">{p.tieuDe}</div>
                    <div className="mt-auto pt-4 text-xs text-stone-500">{formatDate(p.ngayDang)}</div>
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
