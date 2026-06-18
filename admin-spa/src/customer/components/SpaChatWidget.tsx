import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bot, CalendarDays, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { chatApi } from "../../api/chat";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const EMPTY_MESSAGE = "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.";

const INTRO_MESSAGE =
  "Chào anh/chị, em có thể tư vấn dịch vụ spa, giá, ưu đãi và hỗ trợ thông tin đặt lịch.";

function nextId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function SpaChatWidget() {
  const location = useLocation();
  const from = location.pathname + location.search;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "intro", role: "assistant", text: INTRO_MESSAGE },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);

    try {
      const data = await chatApi.ask(text);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: data.answer || EMPTY_MESSAGE,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: EMPTY_MESSAGE,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-3 z-30 sm:bottom-8 sm:right-6">
      {open && (
        <section className="pointer-events-auto mb-3 w-[calc(100vw-1.5rem)] max-w-[360px] overflow-hidden rounded-lg border border-stone-200 bg-white text-stone-900 shadow-xl">
          <header className="flex h-14 items-center justify-between border-b border-stone-200 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-700 text-white">
                <Bot size={17} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Tư vấn AI</div>
                <div className="truncate text-xs text-stone-500">DiemSuong SPA</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng tư vấn AI"
              title="Đóng"
              className="grid h-8 w-8 place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            >
              <X size={17} />
            </button>
          </header>

          <div className="h-[360px] overflow-y-auto bg-stone-50 px-3 py-3">
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[82%] rounded-lg bg-amber-700 px-3 py-2 text-sm leading-6 text-white"
                        : "max-w-[82%] rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm leading-6 text-stone-700"
                    }
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500">
                    <Loader2 size={15} className="animate-spin" />
                    Đang tư vấn
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-stone-200 bg-white p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder="Nhập câu hỏi tư vấn..."
              className="max-h-24 min-h-10 flex-1 resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-700"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Gửi câu hỏi"
              title="Gửi"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-700 text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </form>
        </section>
      )}

      <div className="pointer-events-auto flex flex-col gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Tư vấn AI"
          title="Tư vấn AI"
          className="grid h-11 w-11 place-items-center rounded-full bg-stone-900 text-white shadow-md hover:bg-stone-800 sm:h-12 sm:w-12"
        >
          <MessageCircle size={18} className="sm:hidden" />
          <MessageCircle size={20} className="hidden sm:block" />
        </button>

        <Link
          to="/booking"
          state={{ from }}
          aria-label="Đặt lịch"
          title="Đặt lịch"
          className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md hover:bg-stone-50 sm:h-12 sm:w-12"
        >
          <CalendarDays size={18} className="sm:hidden" />
          <CalendarDays size={20} className="hidden sm:block" />
        </Link>
      </div>
    </div>
  );
}
