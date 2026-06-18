import { api } from "../lib/api";

export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  answer: string;
};

function getSessionId() {
  const key = "spa-chat-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, next);
  return next;
}

export const chatApi = {
  ask: async (message: string) => {
    const res = await api.post<ChatResponse>(
      "/api/chat",
      { message } satisfies ChatRequest,
      { headers: { "x-chat-session-id": getSessionId() } }
    );
    return res.data;
  },
};
