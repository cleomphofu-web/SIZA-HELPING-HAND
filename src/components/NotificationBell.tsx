"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

// ── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  actionPath: string | null;
  readAt: string | null;
  createdAt: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ────────────────────────────────────────────────────────────────

type Props = {
  /** Initial unread count from SSR — avoids a flash on first load */
  initialUnreadCount?: number;
  /** Current user ID for Realtime notifications */
  userId?: string;
};

export function NotificationBell({ initialUnreadCount = 0, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "same-origin" });
      if (!res.ok) return;
      const json = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(json.notifications);
      setUnreadCount(json.unreadCount);
    } catch {
      // background polling error - ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications", { credentials: "same-origin" });
      if (!res.ok) throw new Error("fetch_failed");
      const json = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(json.notifications);
      setUnreadCount(json.unreadCount);
    } catch {
      setError("Could not load notifications. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount (Zero polling: no setInterval)
  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  // Realtime subscription for live notification events
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Listen to in_app_notifications inserts
    const filter = userId ? `user_id=eq.${userId}` : undefined;
    const channel = supabase
      .channel(`in_app_notifications:${userId ?? "global"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
          ...(filter ? { filter } : {}),
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;

          const newNotif: Notification = {
            id: String(row.id ?? `notif-${Date.now()}`),
            kind: String(row.kind ?? "alert"),
            title: String(row.title ?? "Notification"),
            body: String(row.body ?? ""),
            actionPath: (row.action_path as string | null) ?? null,
            readAt: (row.read_at as string | null) ?? null,
            createdAt: String(row.created_at ?? new Date().toISOString()),
          };

          setUnreadCount((c) => c + 1);
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // ── Open / close ───────────────────────────────────────────────────────────

  const openPanel = useCallback(async () => {
    setOpen(true);
    await fetchNotifications();
    // Mark read after the panel is open and data is fresh
    if (unreadCount > 0) {
      void fetch("/api/notifications/mark-read", {
        method: "POST",
        credentials: "same-origin",
      }).then(() => setUnreadCount(0));
    }
  }, [fetchNotifications, unreadCount]);

  const closePanel = useCallback(() => setOpen(false), []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        closePanel();
      }
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, closePanel]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={open ? closePanel : openPanel}
        className={cn(
          "relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full transition-all duration-200",
          open
            ? "bg-white text-black"
            : "text-neutral-400 hover:text-white hover:bg-white/10"
        )}
      >
        <Bell className="size-4 shrink-0" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          aria-modal="false"
          className="absolute bottom-14 right-0 w-80 max-h-[420px] flex flex-col bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Notifications
            </span>
            {notifications.some((n) => n.readAt === null) && (
              <button
                type="button"
                onClick={() => {
                  void fetch("/api/notifications/mark-read", { method: "POST", credentials: "same-origin" });
                  setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
                  setUnreadCount(0);
                }}
                className="text-[11px] text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1" role="list">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-10 text-neutral-500 text-xs">
                Loading…
              </div>
            )}

            {error && (
              <div className="px-4 py-3 text-xs text-red-400">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-500">
                <Bell className="size-6 opacity-30" aria-hidden="true" />
                <span className="text-xs">No notifications yet.</span>
              </div>
            )}

            {notifications.map((n) => {
              const isUnread = n.readAt === null;
              const content = (
                <div
                  role="listitem"
                  className={cn(
                    "flex flex-col gap-0.5 px-4 py-3 border-b border-white/5 transition-colors",
                    isUnread ? "bg-white/5" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn("text-xs font-semibold text-white leading-snug", !isUnread && "font-medium text-neutral-300")}>
                      {isUnread && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 mb-0.5 align-middle" aria-hidden="true" />
                      )}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">{n.body}</p>
                </div>
              );

              return n.actionPath ? (
                <Link key={n.id} href={n.actionPath} onClick={closePanel} className="block">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

