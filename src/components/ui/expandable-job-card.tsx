"use client";

import React, { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
  ClipboardList,
  Navigation,
} from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import type { HelperOfferSummary } from "@/server/views/booking-read";

type ExpandableJobFeedProps = {
  offers: HelperOfferSummary[];
  currentLocation?: string;
  onOfferAccepted?: (bookingId: string) => void;
  onOfferDeclined?: (bookingId: string) => void;
};

// Dynamic task checklist tailored to service type
function getChecklistForServices(services?: string[]): string[] {
  if (!services || services.length === 0) {
    return [
      "Thorough surface dusting & sanitization",
      "Sweep and damp mop all hard floors",
      "Vacuum rugs, mats, and living areas",
      "Sanitize kitchen countertops, sink, and stovetop",
      "Disinfect bathroom toilet, shower, and basin",
      "Empty waste bins and replace liners",
    ];
  }

  const tasks: string[] = [];
  const sList = services.map((s) => s.toLowerCase());

  if (sList.some((s) => s.includes("home") || s.includes("residential") || s.includes("deep"))) {
    tasks.push(
      "High & low surface dusting (tables, shelves, skirting)",
      "Sweep, vacuum, and damp mop all rooms",
      "Kitchen deep wipe: Counters, stove exterior, and sink",
      "Bathroom hygiene: Toilet, basin, shower, and mirrors",
      "Empty trash bins and neaten common areas"
    );
  }

  if (sList.some((s) => s.includes("office") || s.includes("commercial"))) {
    tasks.push(
      "Disinfect office desks, keyboards, and high-touch areas",
      "Clean kitchenette counters, microwave exterior, and sink",
      "Vacuum office carpets and damp-mop corridors",
      "Sanitize office washrooms and restock supplies",
      "Empty all office paper and general waste bins"
    );
  }

  if (sList.some((s) => s.includes("garden") || s.includes("yard"))) {
    tasks.push(
      "Lawn mowing and edge trimming",
      "Rake fallen leaves and sweep paved pathways",
      "Weed flowerbeds and garden borders",
      "Neatly bag and stack garden refuse"
    );
  }

  if (sList.some((s) => s.includes("handyman") || s.includes("maintenance"))) {
    tasks.push(
      "Review specific repair list with host",
      "Execute requested tasks with safety precautions",
      "Clean work area and inspect final result with host"
    );
  }

  if (tasks.length === 0) {
    tasks.push(
      "Complete requested helper tasks per host instructions",
      "Sanitize working tools and touchpoints",
      "Review completed work with host prior to check-out"
    );
  }

  return tasks;
}

// Deterministic distance estimation based on suburb name hash (for realistic preview)
function getEstimatedDistance(suburb: string, slot: number): string {
  let hash = 0;
  for (let i = 0; i < suburb.length; i++) {
    hash = (hash << 5) - hash + suburb.charCodeAt(i);
    hash |= 0;
  }
  const km = ((Math.abs(hash) % 45) / 10 + 1.2 + (slot - 1) * 0.8).toFixed(1);
  return `${km} km away`;
}

export function ExpandableJobFeed({
  offers,
  currentLocation = "All My Suburbs",
  onOfferAccepted,
  onOfferDeclined,
}: ExpandableJobFeedProps) {
  const [active, setActive] = useState<HelperOfferSummary | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Escape key & body overflow lock
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  useOutsideClick(modalRef, () => {
    if (!acceptingId) {
      setActive(null);
    }
  });

  // Handle Accept
  const handleAccept = async (offer: HelperOfferSummary) => {
    setAcceptingId(offer.id);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/helper/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: offer.id,
          slot: offer.slot,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        if (onOfferAccepted) onOfferAccepted(offer.id);
        startTransition(() => {
          router.push(`/helper/jobs/${offer.id}`);
        });
      } else if (res.status === 409 || data?.error?.code === "already_taken") {
        setErrorMessage("Another helper accepted this offer just now.");
        setAcceptingId(null);
      } else {
        setErrorMessage(data?.error?.message ?? "Could not accept offer. Please retry.");
        setAcceptingId(null);
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and retry.");
      setAcceptingId(null);
    }
  };

  const handleDecline = (offer: HelperOfferSummary) => {
    if (onOfferDeclined) onOfferDeclined(offer.id);
    setActive(null);
  };

  return (
    <>
      {/* Dimmed Backdrop with Blur */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm h-full w-full z-50"
          />
        )}
      </AnimatePresence>

      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-50 p-4 sm:p-6 overflow-y-auto">
            <motion.div
              layoutId={`card-${active.id}-${active.slot}-${id}`}
              ref={modalRef}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto"
            >
              {/* Modal Top Header */}
              <div className="relative bg-neutral-950 text-white p-6 sm:p-7 space-y-3">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="absolute top-5 right-5 size-9 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="size-5" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Live Rotation Offer · Slot #{active.slot}
                  </span>
                </div>

                <div className="space-y-1">
                  <motion.h3
                    layoutId={`title-${active.id}-${active.slot}-${id}`}
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2"
                  >
                    <MapPin className="size-6 text-emerald-400 shrink-0" />
                    <span>{active.suburb}</span>
                  </motion.h3>
                  <p className="text-xs text-neutral-400 flex items-center gap-2">
                    <Navigation className="size-3.5 text-neutral-500" />
                    <span>{getEstimatedDistance(active.suburb, active.slot)}</span>
                    <span>·</span>
                    <span>Primary Service Zone</span>
                  </p>
                </div>

                {/* Services Tags */}
                {active.services && active.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {active.services.map((svc) => (
                      <span
                        key={svc}
                        className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-neutral-200 capitalize"
                      >
                        {svc.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Payout Breakdown */}
                {(() => {
                  const payCents = BigInt(active.payPerHelperCents ?? 0);
                  const transCents = BigInt(active.transportPerHelperCents ?? 0);
                  const totalCents = payCents + transCents;
                  const totalRands = (Number(totalCents) / 100).toFixed(0);
                  const wageRands = (Number(payCents) / 100).toFixed(0);
                  const transRands = (Number(transCents) / 100).toFixed(0);

                  return (
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Direct Net Payout
                        </span>
                        <div className="text-3xl font-extrabold tracking-tight text-neutral-900 mt-0.5">
                          R{totalRands}
                          <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            NET
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          R{wageRands} helper wage + R{transRands} transport allowance
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="size-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mx-auto mb-1">
                          ✓
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">100% Direct</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Schedule & Duration */}
                {active.startAt && (
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span>Scheduled Booking Time</span>
                    </span>
                    <p className="text-sm font-bold text-neutral-900">
                      {new Intl.DateTimeFormat("en-ZA", {
                        timeZone: "Africa/Johannesburg",
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(active.startAt))}
                    </p>
                  </div>
                )}

                {/* Cleaning Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-900">
                    <ClipboardList className="size-4 text-emerald-600" />
                    <span>Job Scope &amp; Checklist</span>
                  </div>
                  <div className="space-y-2">
                    {getChecklistForServices(active.services).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed"
                      >
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Host Access & Reveal Notice */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="size-4 text-blue-700" />
                    <span>Privacy &amp; Safety Protocol</span>
                  </div>
                  <p className="text-blue-900/80 leading-relaxed">
                    Exact street address, gate code, and host phone number are revealed immediately after you accept the job.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAccept(active)}
                  disabled={acceptingId !== null}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-black active:scale-[0.98] text-white text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-75"
                >
                  {acceptingId === active.id ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Accepting Job...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span>
                        Accept Job (R
                        {(
                          Number(
                            BigInt(active.payPerHelperCents ?? 0) +
                              BigInt(active.transportPerHelperCents ?? 0)
                          ) / 100
                        ).toFixed(0)}
                        )
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecline(active)}
                  disabled={acceptingId !== null}
                  className="px-4 py-3.5 rounded-2xl border border-neutral-300 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
                >
                  Pass
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Collapsed Feed List */}
      <div className="space-y-3">
        {offers.map((offer) => {
          const totalCents =
            BigInt(offer.payPerHelperCents ?? 0) + BigInt(offer.transportPerHelperCents ?? 0);
          const totalRands = (Number(totalCents) / 100).toFixed(0);
          const dist = getEstimatedDistance(offer.suburb, offer.slot);

          let scheduleText: string | null = null;
          if (offer.startAt) {
            try {
              scheduleText = new Intl.DateTimeFormat("en-ZA", {
                timeZone: "Africa/Johannesburg",
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(offer.startAt));
            } catch {
              scheduleText = offer.startAt;
            }
          }

          return (
            <motion.div
              layoutId={`card-${offer.id}-${offer.slot}-${id}`}
              key={`${offer.id}-${offer.slot}`}
              onClick={() => setActive(offer)}
              className="group p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 hover:border-black/40 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="size-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <MapPin className="size-5 text-emerald-400" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.h3
                      layoutId={`title-${offer.id}-${offer.slot}-${id}`}
                      className="text-base font-bold text-neutral-900 truncate"
                    >
                      {offer.suburb}
                    </motion.h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                      Slot #{offer.slot}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dist}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                    {scheduleText && (
                      <span className="flex items-center gap-1 font-medium text-neutral-700">
                        <Calendar className="size-3" />
                        <span>{scheduleText}</span>
                      </span>
                    )}
                    {offer.services && offer.services.length > 0 && (
                      <span className="capitalize">
                        · {offer.services[0].replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                <div className="text-left sm:text-right">
                  <div className="text-xl font-extrabold tracking-tight text-neutral-900">
                    R{totalRands}
                    <span className="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                      NET
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500">100% Direct Pay</span>
                </div>

                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 group-hover:bg-black text-white text-xs font-semibold shadow-xs">
                  <span>View Scope</span>
                  <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
