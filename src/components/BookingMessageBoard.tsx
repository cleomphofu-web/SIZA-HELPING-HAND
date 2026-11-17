"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, ChevronDown } from "lucide-react";
import { t } from "@/content/t";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { BookingMessage } from "@/server/services/booking-messages";

// Re-export so callers can import the type from one place
export type { BookingMessage } from "@/server/services/booking-messages";

// Internal alias for the senderRole union
type SenderRole = BookingMessage["senderRole"];

type Props = {
  bookingId: string;
  currentUserId: string;
  initialMessages?: BookingMessage[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 1000;

const PRESET_CHIPS: string[] = [
  "I am at the gate",
  "Security boom is open",
  "Running 5 minutes late",
  "Please buzz me in",
  "I have arrived outside",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function roleBadgeLabel(role: SenderRole): string {
  if (role === "host") return t("booking.messages.host_badge");
  if (role === "admin") return t("booking.messages.admin_badge");
  return t("booking.messages.helper_badge");
}

function roleBadgeClass(role: SenderRole): string {
  if (role === "host") return "bg-blue-100 text-blue-800";
  if (role === "admin") return "bg-purple-100 text-purple-800";
  return "bg-emerald-100 text-emerald-800";
}

// ── Component ────────────────────────────────────────────────────────────────

export function BookingMessageBoard({
  bookingId,
  currentUserId,
  initialMessages = [],
}: Props) {
  const [messages, setMessages] = useState<BookingMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initial fetch + Supabase Realtime subscription
  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/messages`, {
          credentials: "same-origin",
          headers: { "Cache-Control": "no-store" },
        });
        if (res.ok && !cancelled) {
          const json: { ok: boolean; data: BookingMessage[] } = await res.json();
          if (json.ok && Array.isArray(json.data)) {
            setMessages(json.data);
          }
        }
      } catch {
        // Silently handle transient network errors on initial load
      }
    }

    void fetchMessages();

    // Setup Supabase Realtime channel for live messages (Zero polling)
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`booking_messages:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking_messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;

          const newMsg: BookingMessage = {
            id: String(row.id ?? `msg-${Date.now()}`),
            bookingId: String(row.booking_id ?? bookingId),
            senderId: String(row.sender_id ?? ""),
            senderRole: (row.sender_role as SenderRole) ?? "helper",
            senderFirstName: String(row.sender_first_name ?? "User"),
            message: String(row.message ?? ""),
            createdAt: String(row.created_at ?? new Date().toISOString()),
          };

          setMessages((prev) => {
            // Avoid duplicate if message already present
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Also deduplicate optimistic messages with same text and sender
            return [
              ...prev.filter(
                (m) => !(m.id.startsWith("optimistic-") && m.senderId === newMsg.senderId && m.message === newMsg.message)
              ),
              newMsg,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);

    // Optimistic update
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: BookingMessage = {
      id: optimisticId,
      bookingId,
      senderId: currentUserId,
      senderRole: "host", // will be corrected by server on next poll
      senderFirstName: "You",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const json: { ok: boolean; data?: BookingMessage; error?: string } =
        await res.json().catch(() => ({ ok: false, error: "Network error" }));

      if (!res.ok || !json.ok) {
        // Roll back optimistic message and show error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticId),
        );
        setDraft(text);
        setSendError(json.error ?? t("booking.messages.error_send"));
      } else {
        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? (json.data as BookingMessage) : m,
          ),
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(text);
      setSendError(t("booking.messages.error_send"));
    } finally {
      setSending(false);
    }
  }

  function applyChip(chip: string) {
    setDraft(chip);
    textareaRef.current?.focus();
  }

  const remaining = MAX_CHARS - draft.length;
  const isMine = (msg: BookingMessage) => msg.senderId === currentUserId;

  return (
    <section
      aria-label={t("booking.messages.title")}
      className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-neutral-100">
        <MessageSquare className="size-5 text-neutral-700 shrink-0" aria-hidden="true" />
        <h2 className="text-base font-bold text-neutral-900 tracking-tight">
          {t("booking.messages.title")}
        </h2>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[160px] max-h-[380px]"
        aria-live="polite"
        aria-label="Message thread"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-2">
            <ChevronDown
              className="size-8 text-neutral-200"
              aria-hidden="true"
            />
            <p className="text-sm text-neutral-400 max-w-xs leading-relaxed">
              {t("booking.messages.empty")}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const mine = isMine(msg);
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[80%] ${mine ? "self-end items-end ml-auto" : "self-start items-start"}`}
              >
                {/* Sender label */}
                <div className="flex items-center gap-1.5">
                  {!mine && (
                    <span className="text-xs font-semibold text-neutral-600">
                      {msg.senderFirstName}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${roleBadgeClass(msg.senderRole)}`}
                  >
                    {roleBadgeLabel(msg.senderRole)}
                  </span>
                  {mine && (
                    <span className="text-xs font-semibold text-neutral-600">
                      You
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    mine
                      ? "bg-black text-white rounded-tr-sm"
                      : "bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-tl-sm"
                  }`}
                >
                  {msg.message}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-neutral-400">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Quick preset chips */}
      <div className="px-5 pb-2 pt-1 border-t border-neutral-100">
        <div
          className="flex flex-wrap gap-2 py-2"
          role="group"
          aria-label="Quick arrival note presets"
        >
          {PRESET_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => applyChip(chip)}
              className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-neutral-700 font-medium transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Compose form */}
      <form
        onSubmit={handleSubmit}
        className="px-5 pb-5 space-y-2"
        aria-label="Send arrival note"
      >
        {sendError && (
          <p role="alert" className="text-xs text-red-600 font-medium">
            {sendError}
          </p>
        )}

        <div className="relative">
          <label htmlFor={`msg-textarea-${bookingId}`} className="sr-only">
            {t("booking.messages.placeholder")}
          </label>
          <textarea
            id={`msg-textarea-${bookingId}`}
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setSendError(null);
              setDraft(e.target.value.slice(0, MAX_CHARS));
            }}
            placeholder={t("booking.messages.placeholder")}
            rows={3}
            maxLength={MAX_CHARS}
            className="w-full resize-none rounded-2xl bg-neutral-50 border border-neutral-200 focus:border-black focus:ring-1 focus:ring-black px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
          />
          <span
            className={`absolute bottom-2 right-3 text-[10px] tabular-nums ${remaining < 100 ? "text-orange-500" : "text-neutral-300"}`}
            aria-live="polite"
          >
            {remaining}
          </span>
        </div>

        <button
          type="submit"
          disabled={sending || draft.trim().length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
          aria-label={sending ? t("booking.messages.sending") : t("booking.messages.send")}
        >
          <Send className="size-3.5" aria-hidden="true" />
          {sending ? t("booking.messages.sending") : t("booking.messages.send")}
        </button>
      </form>
    </section>
  );
}

