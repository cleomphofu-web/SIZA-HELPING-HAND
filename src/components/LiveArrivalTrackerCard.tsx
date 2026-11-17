"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, PhoneCall, Phone, MessageSquare, KeyRound, CheckCircle2, Navigation } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export interface LiveArrivalTrackerCardProps {
  bookingId: string;
  suburb: string;
  initialEnRoute?: { etaMinutes: number; enRouteAt: string } | null;
  bookingStatus: string;
  assignedHelpers: Array<{
    helperId: string;
    firstName: string;
    phone: string;
    checkedInAt: string | null;
  }>;
}

export function LiveArrivalTrackerCard({
  bookingId,
  suburb,
  initialEnRoute = null,
  bookingStatus,
  assignedHelpers,
}: LiveArrivalTrackerCardProps) {
  const [enRoute, setEnRoute] = useState(initialEnRoute);
  const [now, setNow] = useState(() => Date.now());

  const primaryHelper = assignedHelpers[0];
  const helperName = primaryHelper?.firstName ?? "Your helper";
  const helperPhone = primaryHelper?.phone ?? "";
  const isCheckedIn = Boolean(primaryHelper?.checkedInAt) || bookingStatus === "in_progress";

  // Initial status check & Realtime updates for live en-route events (Zero polling)
  useEffect(() => {
    if (bookingStatus !== "assigned" || isCheckedIn) return;

    let cancelled = false;

    // Fetch initial status once on mount
    async function fetchInitial() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/on-my-way`, {
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          status: string;
          enRoute: { etaMinutes: number; enRouteAt: string } | null;
        };
        if (data.enRoute && !cancelled) {
          setEnRoute(data.enRoute);
        }
      } catch {
        // Non-critical initial fetch error
      }
    }

    void fetchInitial();

    // Subscribe to analytics_events where event_name = 'helper_on_my_way'
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`live_arrival:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics_events",
          filter: "event_name=eq.helper_on_my_way",
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;
          const meta = (row.metadata as Record<string, unknown>) ?? {};
          if (meta.booking_id === bookingId || meta.bookingId === bookingId) {
            setEnRoute({
              etaMinutes: Number(meta.eta_minutes ?? meta.etaMinutes ?? 30),
              enRouteAt: String(row.created_at ?? new Date().toISOString()),
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [bookingId, bookingStatus, isCheckedIn]);

  // Recalculate countdown display every 60 seconds (local clock ticker, not an API poll)
  useEffect(() => {
    if (!enRoute) return;
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 60_000);
    return () => clearInterval(ticker);
  }, [enRoute]);

  // ETA Countdown calculations
  const countdown = useMemo(() => {
    if (!enRoute) return null;
    const startMs = new Date(enRoute.enRouteAt).getTime();
    const elapsedMinutes = Math.floor((now - startMs) / 60_000);
    const totalMinutes = enRoute.etaMinutes;
    const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);
    const progressPercent = Math.min(100, Math.max(5, Math.round((elapsedMinutes / totalMinutes) * 100)));

    let label: string;
    if (remainingMinutes > 1) {
      label = `~${remainingMinutes} mins`;
    } else if (remainingMinutes === 1) {
      label = "~1 min";
    } else {
      label = "Arriving shortly";
    }

    const departureTime = new Date(enRoute.enRouteAt).toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      remainingMinutes,
      progressPercent,
      label,
      departureTime,
    };
  }, [enRoute, now]);

  // Clean phone numbers for call/WhatsApp
  const cleanPhone = helperPhone.replace(/\D/g, "");
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null;
  const telUrl = helperPhone ? `tel:${helperPhone}` : null;

  // If already checked in
  if (isCheckedIn) {
    return (
      <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950">
              {helperName} has arrived &amp; checked in
            </h3>
            <p className="text-xs text-emerald-800">
              Job is currently underway in {suburb}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Live Arrival Mode (helper is en route)
  if (enRoute) {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 to-neutral-950 text-white shadow-xl border border-emerald-500/30 space-y-5">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Live Arrival Tracker
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {helperName} is on the way!
              </h3>
            </div>
          </div>

          {/* Dynamic Countdown Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold self-start sm:self-auto">
            <Clock className="size-3.5 text-emerald-400 animate-pulse" />
            <span>Estimated Arrival: {countdown?.label}</span>
          </div>
        </div>

        {/* Progress bar towards arrival */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
            <span>Departed at {countdown?.departureTime}</span>
            <span>Target: ~{enRoute.etaMinutes} mins</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${countdown?.progressPercent ?? 10}%` }}
            />
          </div>
        </div>

        {/* Action Bar & Reminder */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <KeyRound className="size-4 text-emerald-400 shrink-0" />
            <span>Have your 6-digit check-in code ready upon arrival</span>
          </div>

          {/* Quick Contact Buttons */}
          <div className="flex items-center gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <MessageSquare className="size-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {telUrl && (
              <a
                href={telUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <Phone className="size-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pre-departure state (Helper is assigned, waiting for departure)
  return (
    <div className="p-5 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <Navigation className="size-4 text-neutral-300" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Helper Assigned
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {helperName} is preparing for your job
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <PhoneCall className="size-3" />
              <span>Contact {helperName}</span>
            </a>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-400 leading-relaxed">
        You will see live departure updates and estimated arrival time here as soon as {helperName} heads to {suburb}.
      </p>
    </div>
  );
}
