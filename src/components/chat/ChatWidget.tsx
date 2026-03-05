"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Send, X, ChevronDown } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

type ChatMessage = {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  created_at?: string;
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as { randomUUID?: () => string }).randomUUID?.() || "";
  }
  return (
    "chat-" +
    Math.random().toString(36).slice(2) +
    "-" +
    Date.now().toString(36)
  );
}

const FAQ_KEYS = [
  "chat.faq.q1",
  "chat.faq.q2",
  "chat.faq.q3",
  "chat.faq.q4",
  "chat.faq.q5",
];

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] font-bold text-white shadow-sm">
        A
      </div>
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm border border-slate-100">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "0ms" }} />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "150ms" }} />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const pollRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Show invite bubble after 5 seconds
  useEffect(() => {
    if (open || bubbleDismissed) return;
    const timer = setTimeout(() => setShowBubble(true), 5000);
    return () => clearTimeout(timer);
  }, [open, bubbleDismissed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "sb_chat_session_id";
    const existing = window.localStorage.getItem(key);
    if (existing && existing.trim()) {
      setSessionId(existing.trim());
      return;
    }
    const id = createSessionId();
    setSessionId(id);
    window.localStorage.setItem(key, id);
  }, []);

  const fetchMessages = useMemo(
    () =>
      async (currentSessionId: string) => {
        if (!currentSessionId) return;
        try {
          const res = await fetch(
            `/api/chat?sessionId=${encodeURIComponent(currentSessionId)}`
          );
          if (!res.ok) {
            // Əgər rate limit xətası gəlsə, polling-i dayandır
            if (res.status === 429) {
              if (pollRef.current) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
              }
              return;
            }
            return;
          }
          const data = (await res.json()) as { messages?: ChatMessage[] };
          const rows = Array.isArray(data.messages) ? data.messages : [];
          setMessages(rows);
        } catch {
          // Xəta zamanı polling-i dayandırma, sadəcə ignore et
        } finally {
          setLoading(false);
        }
      },
    []
  );

  useEffect(() => {
    if (!open || !sessionId) return;
    setLoading(true);
    fetchMessages(sessionId);
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollRef.current = window.setInterval(() => {
      fetchMessages(sessionId);
    }, 15000); // 15 saniyə interval (əvvəl 5 saniyə idi)
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open, sessionId, fetchMessages]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId) return;
    setSending(true);
    setIsTyping(false);

    // Optimistic: add user message instantly
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      message: text.trim(),
      sender_type: "user",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text.trim(),
          sender: "user",
          locale: locale, // Send current locale to API
        }),
      });
      if (res.ok) {
        // Show typing indicator
        setIsTyping(true);
        // Fetch updated messages (includes AI response)
        // Wait a bit for realistic feel then poll
        await new Promise((r) => setTimeout(r, 800));
        await fetchMessages(sessionId);
        // Keep polling for the AI response
        let attempts = 0;
        const checkForResponse = async () => {
          attempts++;
          const checkRes = await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`);
          if (checkRes.ok) {
            const data = await checkRes.json();
            const rows = Array.isArray(data.messages) ? data.messages : [];
            setMessages(rows);
            const lastMsg = rows[rows.length - 1];
            if (lastMsg && lastMsg.sender_type !== "user") {
              setIsTyping(false);
              return;
            }
          }
          if (attempts < 15) {
            setTimeout(checkForResponse, 1500);
          } else {
            setIsTyping(false);
          }
        };
        checkForResponse();
      }
    } catch {
    } finally {
      setSending(false);
    }
  }, [sessionId, fetchMessages]);

  const handleSend = async () => {
    await sendMessage(input);
  };

  const handleFAQ = async (question: string) => {
    await sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Invite Bubble */}
      {showBubble && !open && (
        <div className="fixed bottom-20 right-5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="relative max-w-[260px] rounded-2xl bg-white p-4 shadow-xl border border-emerald-100">
            <button
              type="button"
              onClick={() => { setShowBubble(false); setBubbleDismissed(true); }}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[10px] hover:bg-slate-300"
            >
              ×
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow">
                  A
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{t("chat.operator_name")}</div>
                <div className="text-[10px] text-emerald-600 font-medium">{t("chat.online")}</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("chat.bubble_message")}
            </p>
            <button
              type="button"
              onClick={() => { setOpen(true); setShowBubble(false); setBubbleDismissed(true); }}
              className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {t("chat.start_chat")}
            </button>
          </div>
          {/* Triangle pointer */}
          <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white border-r border-b border-emerald-100" />
        </div>
      )}

      {/* Chat Toggle Button - mobil görünüşdə navbar-dan yuxarıda */}
      <button
        type="button"
        onClick={() => { setOpen((prev) => !prev); setShowBubble(false); setBubbleDismissed(true); }}
        className={`fixed bottom-20 md:bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          open
            ? "bg-slate-700 hover:bg-slate-800 rotate-0"
            : "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800"
        }`}
      >
        {open ? (
          <ChevronDown size={22} className="text-white" />
        ) : (
          <div className="relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 border border-white" />
            </span>
          </div>
        )}
      </button>

      {/* Chat Window - mobil görünüşdə navbar-dan yuxarıda */}
      {open && (
        <div className="fixed bottom-24 md:bottom-24 right-5 z-40 flex w-[360px] max-w-[calc(100vw-40px)] flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white backdrop-blur-sm">
                    A
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-600 bg-green-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t("chat.operator_name")}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                    {t("chat.operator_role")} · {t("chat.online")}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#f0f4f0] px-4 py-4"
            style={{ maxHeight: "350px", minHeight: "250px" }}
          >
            {/* Welcome message (always show) */}
            {!hasMessages && !loading && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] font-bold text-white shadow-sm">
                  A
                </div>
                <div className="max-w-[80%]">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[13px] text-slate-700 shadow-sm border border-slate-100 leading-relaxed">
                    {t("chat.welcome_message", { name: t("chat.operator_name") })}
                  </div>
                  <div className="mt-1 px-1 text-[10px] text-slate-400">
                    {t("chat.now")}
                  </div>
                </div>
              </div>
            )}

            {loading && !hasMessages && (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.sender_type === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] font-bold text-white shadow-sm">
                      A
                    </div>
                  )}
                  <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                        isUser
                          ? "rounded-br-md bg-emerald-600 text-white"
                          : "rounded-bl-md bg-white text-slate-700 border border-slate-100"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <div className={`mt-1 px-1 text-[10px] text-slate-400 ${isUser ? "text-right" : ""}`}>
                      {formatTime(msg.created_at)}
                      {isUser && (
                        <span className="ml-1 text-emerald-500">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}
          </div>

          {/* FAQ Quick Buttons */}
          {!hasMessages && (
            <div className="bg-white border-t border-slate-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t("chat.faq_title")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FAQ_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFAQ(t(key))}
                    disabled={sending}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors disabled:opacity-50"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Mini Suggestions (when there are messages) */}
          {hasMessages && messages.length < 6 && (
            <div className="bg-white border-t border-slate-100 px-4 py-2">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {FAQ_KEYS.slice(0, 3).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFAQ(t(key))}
                    disabled={sending}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-center gap-2 bg-white border-t border-slate-200 px-4 py-3">
            <input
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.input_placeholder")}
              disabled={sending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
