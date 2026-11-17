"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  KeyRound,
  History,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Flag,
  Settings,
  Send,
  Loader2,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { HelperOfferSummary } from "@/server/views/booking-read";
import type { HelperAssignedJobSummary } from "@/server/views/booking";
import type { HelperMetrics } from "@/server/views/booking-read";
import { HelperSubscriptionBanner } from "@/components/HelperSubscriptionBanner";
import { GooeyLocationSetter } from "@/components/ui/gooey-location-setter";
import { ExpandableJobFeed } from "@/components/ui/expandable-job-card";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { NotificationBell } from "@/components/NotificationBell";

type HelperHomeDashboardProps = {
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  helper: {
    id?: string;
    status: string;
    verificationStatus?: string;
    suburbs: string[];
    services: string[];
    jobTitle: string;
    bio: string | null;
    firstJobCompletedAt?: string | null;
    subscriptionStatus?: string;
    subscriptionPaidUntil?: string | null;
  } | null;
  offers: HelperOfferSummary[];
  assignedJobs?: HelperAssignedJobSummary[];
  metrics?: HelperMetrics | null;
};

const POPULAR_SUBURBS = [
  "All My Suburbs",
  "Soweto",
  "Sandton",
  "Rosebank",
  "Randburg",
  "Midrand",
  "Roodepoort",
  "Bryanston",
  "Fourways",
  "Johannesburg South",
  "Vereeniging",
  "Vanderbijlpark",
];

type MessageItem = {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_role: "host" | "helper" | "admin";
  sender_first_name: string;
  message: string;
  created_at: string;
};

export function HelperHomeDashboard({
  profile,
  helper,
  offers,
  assignedJobs = [],
}: HelperHomeDashboardProps) {
  // 3 Lifecycle State Tabs: "nearby", "active", "past"
  const [activeTab, setActiveTab] = useState<"nearby" | "active" | "past">("nearby");

  const helperSuburbs = helper?.suburbs ?? [];
  const defaultSub = helperSuburbs[0] || "Johannesburg";
  const [currentLocation, setCurrentLocation] = useState<string>(defaultSub);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsDetected, setGpsDetected] = useState<boolean>(false);

  // Live offers state with Realtime synchronization
  const [liveOffers, setLiveOffers] = useState<HelperOfferSummary[]>(offers);

  useEffect(() => {
    setLiveOffers(offers);
  }, [offers]);

  // Realtime WebSocket listener on open jobs / assignments
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("helper_realtime_jobs")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "phase_a_bookings" },
        (payload: { eventType: string; new?: { id?: string; status?: string } }) => {
          if (payload.eventType === "UPDATE") {
            const row = payload.new;
            if (row?.id && row?.status && row.status !== "open") {
              setLiveOffers((prev) => prev.filter((o) => o.id !== row.id));
            }
          }
        }
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "booking_assignments" },
        (payload: { eventType: string; new?: { booking_id?: string; slot?: number } }) => {
          const row = payload.new;
          if (row?.booking_id && row?.slot) {
            setLiveOffers((prev) =>
              prev.filter((o) => !(o.id === row.booking_id && o.slot === row.slot))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter offers based on selected suburb
  const filteredOffers = liveOffers.filter((offer) => {
    if (currentLocation === "All My Suburbs") return true;
    return offer.suburb.toLowerCase().includes(currentLocation.toLowerCase());
  });

  // Separate assignments
  const activeAssignments = assignedJobs.filter(
    (j) => j.assignmentStatus === "accepted" && j.status !== "completed" && j.status !== "cancelled"
  );
  const completedAssignments = assignedJobs.filter(
    (j) => j.assignmentStatus === "completed" || j.status === "completed"
  );

  const primaryActiveJob = activeAssignments[0] || null;

  // Active Job Check-in code state
  const [checkInCode, setCheckInCode] = useState<string>("");
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [checkInSuccess, setCheckInSuccess] = useState<boolean>(
    Boolean(primaryActiveJob?.checkedInAt)
  );
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Active Job Scoped Chat Room
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Load chat messages when active job is present
  useEffect(() => {
    if (!primaryActiveJob) return;

    let isMounted = true;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/bookings/${primaryActiveJob!.bookingId}/messages`);
        const json = await res.json().catch(() => null);
        if (isMounted && json?.ok && Array.isArray(json.data)) {
          setChatMessages(json.data);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadMessages();

    // Scoped Realtime channel: job_room:${bookingId}
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const roomChannel = supabase
      .channel(`job_room:${primaryActiveJob.bookingId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "booking_messages",
          filter: `booking_id=eq.${primaryActiveJob.bookingId}`,
        },
        (payload: { new?: MessageItem }) => {
          if (payload.new) {
            setChatMessages((prev) => [...prev, payload.new as MessageItem]);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(roomChannel);
    };
  }, [primaryActiveJob?.bookingId]);

  // Submit check-in code
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryActiveJob) return;
    setCheckInError(null);
    setCheckingIn(true);

    try {
      const res = await fetch("/api/helper/jobs/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: primaryActiveJob.bookingId,
          code: checkInCode.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok && data.data?.checkedIn) {
        setCheckInSuccess(true);
      } else {
        setCheckInError(data?.error?.message || "Invalid check-in code. Please confirm with host.");
      }
    } catch {
      setCheckInError("Network error. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  // Send message in Job Room
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryActiveJob || !newMessage.trim() || sendingMessage) return;
    setSendingMessage(true);

    try {
      const text = newMessage.trim();
      setNewMessage("");

      const res = await fetch(`/api/bookings/${primaryActiveJob.bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.data) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      }
    } catch {
      // Ignored
    } finally {
      setSendingMessage(false);
    }
  };

  // GPS Locator
  function handleDetectGPS() {
    setIsLocating(true);
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setIsLocating(false);
        setGpsDetected(true);
        if (helperSuburbs.length > 0) {
          setCurrentLocation(helperSuburbs[0]);
        }
      },
      () => {
        setIsLocating(false);
        alert("Could not detect precise location. Please select your suburb manually.");
      },
      { timeout: 10000 }
    );
  }

  // Calculate total earnings
  const totalCompletedPayCents = completedAssignments.reduce(
    (sum, j) => sum + BigInt(j.payPerHelperCents || 0) + BigInt(j.transportPerHelperCents || 0),
    BigInt(0)
  );
  const totalCompletedWageCents = completedAssignments.reduce(
    (sum, j) => sum + BigInt(j.payPerHelperCents || 0),
    BigInt(0)
  );
  const totalCompletedTransportCents = completedAssignments.reduce(
    (sum, j) => sum + BigInt(j.transportPerHelperCents || 0),
    BigInt(0)
  );

  const totalEarningsRands = (Number(totalCompletedPayCents) / 100).toFixed(0);
  const totalWageRands = (Number(totalCompletedWageCents) / 100).toFixed(0);
  const totalTransportRands = (Number(totalCompletedTransportCents) / 100).toFixed(0);

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black font-sans pb-36">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/helper"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Helper Hub
            </span>
          </div>
          <div className="flex items-center gap-2">
            {helper?.id && (
              <NotificationBell userId={helper.id} />
            )}
            <Link
              href="/helper/report"
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Flag className="size-3.5 text-red-400" />
              <span className="hidden sm:inline">Report</span>
            </Link>
            <Link
              href="/helper/account"
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="size-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* TAB 1: NEARBY OPEN JOBS */}
        {activeTab === "nearby" && (
          <div className="space-y-6 animate-fade-in">
            {/* Welcome & Gooey Location Setter Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Johannesburg &amp; Vaal · Realtime Rotation
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                    Welcome back, {profile?.firstName ? profile.firstName : "Helper"}
                  </h1>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60 self-start sm:self-auto">
                  <ShieldCheck className="size-3.5" />
                  <span>
                    {helper?.verificationStatus === "verified" ? "Verified Helper" : "Setup Mode"}
                  </span>
                </div>
              </div>

              {/* Gooey Location Setter Component */}
              <div className="pt-1">
                <GooeyLocationSetter
                  currentLocation={currentLocation}
                  onLocationChange={(suburb) => {
                    setCurrentLocation(suburb);
                    setGpsDetected(false);
                  }}
                  registeredSuburbs={helperSuburbs}
                  popularSuburbs={POPULAR_SUBURBS}
                  gpsDetected={gpsDetected}
                  onDetectGPS={handleDetectGPS}
                  isLocating={isLocating}
                />
              </div>
            </div>

            {/* Subscription Gate Banner (if applicable) */}
            <HelperSubscriptionBanner
              firstJobCompletedAt={helper?.firstJobCompletedAt ?? null}
              subscriptionStatus={helper?.subscriptionStatus ?? "none"}
              subscriptionPaidUntil={helper?.subscriptionPaidUntil ?? null}
              helperId={helper?.id}
              helperPhone={profile?.phone}
            />

            {/* Nearby Open Jobs Feed */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                    <span>Nearby Open Jobs</span>
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Live broadcast matching {currentLocation}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {filteredOffers.length} available
                </span>
              </div>

              {filteredOffers.length > 0 ? (
                <ExpandableJobFeed
                  offers={filteredOffers}
                  currentLocation={currentLocation}
                  helperVerificationStatus={helper?.verificationStatus || "verified"}
                  onOfferAccepted={() => {
                    setActiveTab("active");
                  }}
                />
              ) : (
                <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center space-y-3">
                  <Clock className="size-8 text-neutral-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-neutral-900">
                    No open jobs in {currentLocation} right now
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    When hosts book in this area, open rotation offers stream in here live.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentLocation("All My Suburbs")}
                    className="text-xs text-black font-semibold underline underline-offset-4 cursor-pointer"
                  >
                    View all my suburbs
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE JOB (UNLOCKED ADDRESS & REALTIME JOB ROOM) */}
        {activeTab === "active" && (
          <div className="space-y-6 animate-fade-in">
            {primaryActiveJob ? (
              <>
                {/* Active Job Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">
                          Active Assignment · Slot #{primaryActiveJob.slot}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                        {primaryActiveJob.suburb}
                      </h1>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-neutral-500">Agreed Direct Payout</span>
                      <p className="text-2xl font-black text-neutral-900">
                        R
                        {(
                          Number(
                            BigInt(primaryActiveJob.payPerHelperCents || 0) +
                              BigInt(primaryActiveJob.transportPerHelperCents || 0)
                          ) / 100
                        ).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Unlocked Address & Host Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address Box */}
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                        <MapPin className="size-4 text-emerald-600" />
                        <span>Unlocked Street Address</span>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">
                        {primaryActiveJob.addressLine || `${primaryActiveJob.suburb}, Johannesburg`}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          primaryActiveJob.addressLine || primaryActiveJob.suburb
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline pt-1"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>

                    {/* Host Contact Box */}
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                        <Phone className="size-4 text-emerald-600" />
                        <span>Host Contact</span>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">
                        {primaryActiveJob.hostFirstName || "Host"} ·{" "}
                        {primaryActiveJob.hostPhone || "Phone on file"}
                      </p>
                      {primaryActiveJob.hostPhone && (
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`tel:${primaryActiveJob.hostPhone}`}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                          >
                            Call Host
                          </a>
                          <a
                            href={`https://wa.me/${primaryActiveJob.hostPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Date, Time & Scope Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
                    <div>
                      <span className="font-semibold text-neutral-500 block">Scheduled Start Time:</span>
                      <span className="text-neutral-900 font-medium">
                        {new Intl.DateTimeFormat("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(primaryActiveJob.startAt))}
                      </span>
                    </div>
                    {primaryActiveJob.services && primaryActiveJob.services.length > 0 && (
                      <div>
                        <span className="font-semibold text-neutral-500 block">Requested Services:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {primaryActiveJob.services.map((svc) => (
                            <span key={svc} className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-bold capitalize">
                              {svc.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {primaryActiveJob.accessNotes && (
                      <div className="col-span-full pt-1 border-t border-neutral-200">
                        <span className="font-semibold text-neutral-500 block">Access & Gate Notes:</span>
                        <p className="text-neutral-700 text-xs mt-0.5 leading-relaxed">
                          {primaryActiveJob.accessNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Arrival Check-In Code Section */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950 text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="size-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white">
                          Arrival Check-In Confirmation
                        </h3>
                      </div>
                      {checkInSuccess && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
                          Checked In ✓
                        </span>
                      )}
                    </div>

                    {checkInSuccess ? (
                      <p className="text-xs text-emerald-300 leading-relaxed">
                        You have successfully checked in for this job. Complete the scheduled tasks and collect your direct payment upon checkout.
                      </p>
                    ) : (
                      <form onSubmit={handleCheckIn} className="space-y-3">
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Ask your host for their 6-digit access code upon entering the premises to log arrival.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={checkInCode}
                            onChange={(e) => setCheckInCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 6-digit code"
                            className="w-48 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            required
                          />
                          <button
                            type="submit"
                            disabled={checkingIn || checkInCode.length !== 6}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            {checkingIn ? "Verifying..." : "Confirm Arrival"}
                          </button>
                        </div>
                        {checkInError && (
                          <p className="text-xs text-rose-400">{checkInError}</p>
                        )}
                      </form>
                    )}
                  </div>

                  {/* Realtime Job Room Chat */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-900">
                        <MessageSquare className="size-4 text-emerald-600" />
                        <span>Job Room: Direct Host Coordination</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Live Room Active
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 h-64 overflow-y-auto space-y-3">
                      {chatMessages.length > 0 ? (
                        chatMessages.map((msg) => {
                          const isMe = msg.sender_role === "helper";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                                  isMe
                                    ? "bg-neutral-900 text-white rounded-br-xs"
                                    : "bg-white text-neutral-900 border border-neutral-200 rounded-bl-xs"
                                }`}
                              >
                                <span className="block text-[10px] font-bold opacity-60 mb-0.5">
                                  {msg.sender_first_name} ({msg.sender_role})
                                </span>
                                <p className="leading-relaxed">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                          <span>No messages yet. Send a note to your host.</span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Write a message to host (e.g. at the gate)..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="p-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Send message"
                      >
                        <Send className="size-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl p-10 border border-neutral-200/80 text-center space-y-4">
                <div className="size-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <KeyRound className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-neutral-900">No Active Job Right Now</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    When you accept an open rotation job, its unlocked address, host details, and live coordination room will appear here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("nearby")}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Browse Nearby Open Jobs →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAST & EARNINGS SUMMARY */}
        {activeTab === "past" && (
          <div className="space-y-6 animate-fade-in">
            {/* Total Earnings Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Net Payouts Summary
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mt-1">
                    R{totalEarningsRands}
                  </h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                  100% Direct Payouts
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-neutral-500 font-medium">Helper Base Wages</span>
                  <p className="text-base font-bold text-neutral-900">R{totalWageRands}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-neutral-500 font-medium">Transport Allowances</span>
                  <p className="text-base font-bold text-neutral-900">R{totalTransportRands}</p>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>siZa charges zero commission on completed job payouts.</span>
              </p>
            </div>

            {/* Completed Jobs History */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <History className="size-4 text-emerald-600" />
                  <span>Completed Jobs History ({completedAssignments.length})</span>
                </h3>
              </div>

              {completedAssignments.length > 0 ? (
                <div className="space-y-3">
                  {completedAssignments.map((job) => {
                    const totalCents =
                      BigInt(job.payPerHelperCents || 0) +
                      BigInt(job.transportPerHelperCents || 0);
                    const rands = (Number(totalCents) / 100).toFixed(0);

                    let formattedDate = job.startAt;
                    try {
                      formattedDate = new Intl.DateTimeFormat("en-ZA", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(job.startAt));
                    } catch {
                      // Fallback
                    }

                    return (
                      <div
                        key={`${job.bookingId}-${job.slot}`}
                        className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-neutral-900">{job.suburb}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              Completed
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500">{formattedDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-neutral-900">R{rands} NET</p>
                          <span className="text-[10px] text-neutral-500">Paid Direct</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200 text-center text-xs text-neutral-500">
                  <span>No completed jobs yet. Accept an open job to start earning.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM FLOATING NAVIGATION DOCK (SIZA Pill Style — 3 Clean Lifecycle Tabs) */}
      <nav
        aria-label="Helper Activity Lifecycle"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-black/95 text-white shadow-2xl backdrop-blur-xl border border-white/15 transition-all duration-300"
      >
        <div className="flex items-center gap-1 pl-1">
          <Link
            href="/helper"
            className="min-h-[44px] inline-flex items-center px-2.5 text-xs font-bold tracking-tighter text-neutral-300 hover:text-white transition-colors"
          >
            siZa.
          </Link>
          <div className="h-4 w-px bg-white/20 mr-1" aria-hidden="true" />
        </div>

        {/* Tab 1: Nearby Jobs */}
        <button
          type="button"
          onClick={() => setActiveTab("nearby")}
          className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer ${
            activeTab === "nearby"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
          aria-current={activeTab === "nearby" ? "page" : undefined}
        >
          <MapPin className="size-3.5" />
          <span>Nearby</span>
          {filteredOffers.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "nearby"
                  ? "bg-neutral-900 text-white"
                  : "bg-white/20 text-neutral-200"
              }`}
            >
              {filteredOffers.length}
            </span>
          )}
        </button>

        {/* Tab 2: Active Job */}
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer ${
            activeTab === "active"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
          aria-current={activeTab === "active" ? "page" : undefined}
        >
          <KeyRound className="size-3.5" />
          <span>Active</span>
          {primaryActiveJob && (
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* Tab 3: Past & Earnings */}
        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer ${
            activeTab === "past"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
          aria-current={activeTab === "past" ? "page" : undefined}
        >
          <History className="size-3.5" />
          <span>Earnings</span>
        </button>
      </nav>
    </main>
  );
}
