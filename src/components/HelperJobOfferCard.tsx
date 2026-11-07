"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type { HelperOfferSummary } from "@/server/views/booking-read";

type HelperJobOfferCardProps = {
  offer: HelperOfferSummary;
  initialSeconds?: number;
  onAccepted?: (bookingId: string) => void;
  onDeclined?: (bookingId: string) => void;
};

export function HelperJobOfferCard({
  offer,
  initialSeconds = 60,
  onAccepted,
  onDeclined,
}: HelperJobOfferCardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Compute initial remaining seconds
  const computeInitialRemaining = (): number => {
    if (offer.expiresAt) {
      const expiryMs = new Date(offer.expiresAt).getTime();
      const diffSec = Math.floor((expiryMs - Date.now()) / 1000);
      return Math.max(0, diffSec);
    }
    return initialSeconds;
  };

  const [totalTimerSec] = useState(() => Math.max(computeInitialRemaining(), initialSeconds));
  const [timeLeft, setTimeLeft] = useState<number>(computeInitialRemaining);
  const [status, setStatus] = useState<
    "idle" | "accepting" | "accepted" | "expired" | "taken" | "declined" | "error"
  >(() => (computeInitialRemaining() <= 0 ? "expired" : "idle"));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ticking countdown
  useEffect(() => {
    if (status !== "idle") return;

    if (timeLeft <= 0) {
      setStatus("expired");
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, timeLeft]);

  // Handle Accept
  const handleAccept = async () => {
    if (status !== "idle" || timeLeft <= 0) return;

    setStatus("accepting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/helper/jobs/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: offer.id,
          slot: offer.slot,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setStatus("accepted");
        if (onAccepted) onAccepted(offer.id);
        startTransition(() => {
          router.push(`/helper/jobs/${offer.id}`);
        });
      } else if (res.status === 409 || data?.error?.code === "already_taken") {
        setStatus("taken");
      } else {
        setStatus("error");
        setErrorMessage(data?.error?.message ?? "Could not accept this offer. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and retry.");
    }
  };

  // Handle Decline / Pass
  const handleDecline = () => {
    setStatus("declined");
    if (onDeclined) {
      onDeclined(offer.id);
    }
  };

  if (status === "declined") {
    return (
      <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs flex items-center justify-between animate-fade-out">
        <span>Offer passed. You remain eligible for upcoming jobs in your suburbs.</span>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-neutral-900 font-semibold hover:underline ml-2"
        >
          Undo
        </button>
      </div>
    );
  }

  // Payout math
  const payCents = BigInt(offer.payPerHelperCents ?? 0);
  const transportCents = BigInt(offer.transportPerHelperCents ?? 0);
  const totalCents = payCents + transportCents;
  const totalRands = (Number(totalCents) / 100).toFixed(0);
  const payRands = (Number(payCents) / 100).toFixed(0);
  const transportRands = (Number(transportCents) / 100).toFixed(0);

  // Time & progress formatting
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalTimerSec) * 100));
  const isUrgent = timeLeft <= 15;
  const isMedium = timeLeft > 15 && timeLeft <= 30;

  // Formatting date/time
  let formattedSchedule: string | null = null;
  let durationEstimate: string | null = null;

  if (offer.startAt) {
    try {
      const startDate = new Date(offer.startAt);
      formattedSchedule = new Intl.DateTimeFormat("en-ZA", {
        timeZone: "Africa/Johannesburg",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(startDate);

      if (offer.endAt) {
        const endDate = new Date(offer.endAt);
        const hours = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
        durationEstimate = `${hours} hr${hours > 1 ? "s" : ""}`;
      }
    } catch {
      // Fallback
      formattedSchedule = offer.startAt;
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-md ${
        status === "accepted"
          ? "border-emerald-500 bg-emerald-50/50"
          : status === "taken" || status === "expired"
          ? "border-neutral-300 bg-neutral-100/80 opacity-75"
          : isUrgent
          ? "border-rose-400 bg-white ring-2 ring-rose-300/40"
          : isMedium
          ? "border-amber-400 bg-white ring-2 ring-amber-300/30"
          : "border-emerald-200 bg-white hover:border-emerald-400"
      }`}
    >
      {/* Top Offer Highlight Badge & Timer Header */}
      <div className="bg-neutral-900 text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Fair Rotation Offer
          </span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs text-white/80 font-mono">
            Slot #{offer.slot}
          </span>
        </div>

        {status === "idle" && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
              isUrgent
                ? "bg-rose-500 text-white animate-pulse"
                : isMedium
                ? "bg-amber-500 text-black"
                : "bg-emerald-600/80 text-white"
            }`}
          >
            <Clock className="size-3" />
            <span>{timeLeft}s</span>
          </div>
        )}

        {status === "expired" && (
          <span className="text-xs font-semibold text-neutral-400">Expired</span>
        )}

        {status === "taken" && (
          <span className="text-xs font-semibold text-amber-400">Slot Filled</span>
        )}
      </div>

      {/* Countdown Progress Bar (Only during idle active countdown) */}
      {status === "idle" && (
        <div
          role="progressbar"
          aria-valuenow={timeLeft}
          aria-valuemin={0}
          aria-valuemax={totalTimerSec}
          className="w-full h-1.5 bg-neutral-200 overflow-hidden"
        >
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Suburb & Net Payout Headline */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-lg sm:text-xl">
              <MapPin className="size-5 text-emerald-600 shrink-0" />
              <span>{offer.suburb}</span>
            </div>
            {offer.services && offer.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {offer.services.map((svc) => (
                  <span
                    key={svc}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-700 capitalize"
                  >
                    {svc.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Big Net Pay Badge */}
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              R{totalRands}
              <span className="ml-1 text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
                NET
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              R{payRands} wage + R{transportRands} transport
            </p>
          </div>
        </div>

        {/* Schedule & Duration Information */}
        {formattedSchedule && (
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-neutral-500" />
              <span className="font-semibold text-neutral-900">{formattedSchedule}</span>
            </div>
            {durationEstimate && (
              <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 font-medium text-neutral-600">
                ~{durationEstimate}
              </span>
            )}
          </div>
        )}

        {/* Platform Direct Payout Assurance */}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>100% direct payment · Zero commission / no agency cut</span>
        </div>

        {/* Feedback / Error Banners */}
        {status === "taken" && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <span>Another helper in rotation accepted this job just now.</span>
          </div>
        )}

        {status === "expired" && (
          <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs flex items-center gap-2">
            <Clock className="size-4 text-neutral-500 shrink-0" />
            <span>Accept window expired. The offer has been passed to the next helper.</span>
          </div>
        )}

        {status === "accepted" && (
          <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Job accepted! Opening booking address and details...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        {status === "idle" && (
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/15 transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>Accept Job (R{totalRands})</span>
            </button>
            <button
              type="button"
              onClick={handleDecline}
              title="Pass offer to next helper"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-100 active:scale-[0.98] text-neutral-600 hover:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              <X className="size-4" />
              <span>Pass</span>
            </button>
          </div>
        )}

        {status === "accepting" && (
          <button
            type="button"
            disabled
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 text-white text-sm font-semibold opacity-90 cursor-wait"
          >
            <Loader2 className="size-4 animate-spin" />
            <span>Securing slot on server...</span>
          </button>
        )}

        {(status === "taken" || status === "expired") && (
          <button
            type="button"
            onClick={handleDecline}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Dismiss</span>
          </button>
        )}
      </div>
    </div>
  );
}
