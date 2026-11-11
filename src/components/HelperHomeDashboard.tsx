"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  History,
  MapPin,
  Navigation,
  ChevronRight,
  Clock,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Flag,
  Settings,
  ShieldCheck,
  Check,
} from "lucide-react";
import type { HelperOfferSummary } from "@/server/views/booking-read";
import type { HelperAssignedJobSummary } from "@/server/views/booking";
import type { HelperMetrics } from "@/server/views/booking-read";
import { HelperSubscriptionBanner } from "@/components/HelperSubscriptionBanner";

type HelperHomeDashboardProps = {
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  helper: {
    id?: string;
    status: string;
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

export function HelperHomeDashboard({
  profile,
  helper,
  offers,
  assignedJobs = [],
  metrics,
}: HelperHomeDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "jobs">("home");
  const [jobsSubFilter, setJobsSubFilter] = useState<"active" | "completed" | "all">("active");

  const helperSuburbs = helper?.suburbs ?? [];
  const defaultSub = helperSuburbs[0] || "Johannesburg";
  const [currentLocation, setCurrentLocation] = useState<string>(defaultSub);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsDetected, setGpsDetected] = useState<boolean>(false);

  // Filter offers based on selected location
  const filteredOffers = offers.filter((offer) => {
    if (currentLocation === "All My Suburbs") return true;
    return offer.suburb.toLowerCase().includes(currentLocation.toLowerCase());
  });

  // Separate jobs into active and completed/declined history
  const activeAssignments = assignedJobs.filter(
    (j) => j.assignmentStatus === "accepted" && j.status !== "completed" && j.status !== "cancelled"
  );
  const completedAssignments = assignedJobs.filter(
    (j) => j.assignmentStatus === "completed" || j.status === "completed"
  );

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

  return (
    <main className="min-h-screen bg-[#121212] text-white font-sans pb-28 selection:bg-[#E87A41] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/helper" className="text-xl font-black tracking-tighter text-white">
            siZa<span className="text-[#E87A41]">.</span>
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
            Helper
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/helper/report"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Flag className="size-3.5 text-red-400" />
            <span className="hidden sm:inline">Report</span>
          </Link>
          <Link
            href="/helper/account"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Settings className="size-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </header>

      {/* TAB 1: HOME (LOCATION & LIVE JOBS FEED) */}
      {activeTab === "home" && (
        <div>
          {/* Warm Orange Top Container */}
          <section className="bg-gradient-to-b from-[#E87A41] via-[#D36730] to-[#BC5521] px-4 pt-5 pb-8 rounded-b-[36px] shadow-2xl relative overflow-hidden">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-white/80">
                    Welcome Back
                  </p>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {profile?.firstName ? profile.firstName : "Helper"}
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white border border-white/10">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Rotation Online</span>
                </div>
              </div>

              {/* Floating Location Setter Card */}
              <div className="bg-[#1E1E1E]/95 backdrop-blur-xl p-4 rounded-2xl border border-white/15 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#E87A41]" />
                    Active Area
                  </span>
                  {gpsDetected && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="size-3" /> GPS Locked
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <select
                      value={currentLocation}
                      onChange={(e) => {
                        setCurrentLocation(e.target.value);
                        setGpsDetected(false);
                      }}
                      className="w-full h-11 px-3 pr-8 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-[#E87A41] transition-all cursor-pointer appearance-none [&>option]:bg-[#1E1E1E] [&>option]:text-white"
                    >
                      {helperSuburbs.length > 0 && (
                        <optgroup label="My Registered Suburbs">
                          {helperSuburbs.map((sub) => (
                            <option key={`my-${sub}`} value={sub}>
                              {sub} (Registered)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Regions">
                        {POPULAR_SUBURBS.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronRight className="size-4 text-neutral-400 absolute right-3 top-3.5 pointer-events-none rotate-90" />
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isLocating}
                    className="h-11 px-3.5 rounded-xl bg-[#E87A41] hover:bg-[#d66c35] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <Navigation className={`size-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    <span>{isLocating ? "Locating…" : "GPS"}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Lower Jobs Feed Section */}
          <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
            {/* Subscription Gate Banner (if applicable) */}
            <HelperSubscriptionBanner
              firstJobCompletedAt={helper?.firstJobCompletedAt ?? null}
              subscriptionStatus={helper?.subscriptionStatus ?? "none"}
              subscriptionPaidUntil={helper?.subscriptionPaidUntil ?? null}
              helperId={helper?.id}
              helperPhone={profile?.phone}
            />

            {/* Active Jobs Quick Access */}
            {activeAssignments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-emerald-400" />
                    <span>In-Progress &amp; Check-In ({activeAssignments.length})</span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {activeAssignments.map((job) => {
                    const totalCents =
                      BigInt(job.payPerHelperCents) + BigInt(job.transportPerHelperCents);
                    const rands = (Number(totalCents) / 100).toFixed(0);
                    return (
                      <Link
                        key={`${job.bookingId}-${job.slot}`}
                        href={`/helper/jobs/${job.bookingId}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-emerald-500/30 hover:border-emerald-500/60 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <KeyRound className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {job.suburb}
                            </p>
                            <p className="text-xs text-neutral-400">
                              R{rands} Total Pay · Enter Code
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <span>Check In</span>
                          <ChevronRight className="size-4" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Jobs Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Available Jobs Near You</span>
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Showing requests near {currentLocation}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white">
                  {filteredOffers.length} available
                </span>
              </div>

              {filteredOffers.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredOffers.map((offer) => {
                    const totalCents =
                      BigInt(offer.payPerHelperCents) + BigInt(offer.transportPerHelperCents);
                    const rands = (Number(totalCents) / 100).toFixed(0);
                    return (
                      <div
                        key={`${offer.id}-${offer.slot}`}
                        className="p-4 rounded-2xl bg-[#1E1E1E] border border-white/10 hover:border-[#E87A41]/50 transition-all flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-11 rounded-xl bg-white/5 border border-white/10 text-[#E87A41] flex items-center justify-center shrink-0">
                            <MapPin className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {offer.suburb}
                              </h3>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                                Slot #{offer.slot}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                              <span className="font-extrabold text-emerald-400">R{rands}</span>
                              <span>·</span>
                              <span>Direct Pay</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/helper/jobs/${offer.id}`}
                          className="size-10 rounded-xl bg-[#E87A41] hover:bg-[#d66c35] text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md"
                          aria-label={`View offer in ${offer.suburb}`}
                        >
                          <ChevronRight className="size-5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                  <Clock className="size-8 text-neutral-500 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">
                    No open jobs in {currentLocation} right now
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    When hosts book in this area, jobs appear here automatically via fair rotation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentLocation("All My Suburbs")}
                    className="text-xs text-[#E87A41] font-semibold underline underline-offset-4 cursor-pointer"
                  >
                    View all my suburbs
                  </button>
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            {metrics && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Done</span>
                  <p className="text-lg font-black text-white">{metrics.completedJobs}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Active</span>
                  <p className="text-lg font-black text-[#E87A41]">
                    {metrics.acceptedJobs - metrics.completedJobs}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Earned</span>
                  <p className="text-lg font-black text-emerald-400">
                    R{(metrics.totalEarningsCents / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: JOBS (ACCEPTED, DONE, AND DECLINED ACTIVITY HISTORY) */}
      {activeTab === "jobs" && (
        <div className="max-w-md mx-auto px-4 pt-5 space-y-5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Job Activity</h1>
            <p className="text-xs text-neutral-400">
              History of accepted, completed, and past jobs
            </p>
          </div>

          {/* Sub-filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setJobsSubFilter("active")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                jobsSubFilter === "active"
                  ? "bg-[#E87A41] text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Active ({activeAssignments.length})
            </button>
            <button
              type="button"
              onClick={() => setJobsSubFilter("completed")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                jobsSubFilter === "completed"
                  ? "bg-[#E87A41] text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Done ({completedAssignments.length})
            </button>
            <button
              type="button"
              onClick={() => setJobsSubFilter("all")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                jobsSubFilter === "all"
                  ? "bg-[#E87A41] text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({assignedJobs.length})
            </button>
          </div>

          {/* Jobs List */}
          <div className="space-y-3">
            {assignedJobs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <Clock className="size-8 text-neutral-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No jobs recorded yet</h3>
                <p className="text-xs text-neutral-400">
                  Accepted jobs will appear here with full history and check-in records.
                </p>
              </div>
            ) : (
              (jobsSubFilter === "active"
                ? activeAssignments
                : jobsSubFilter === "completed"
                ? completedAssignments
                : assignedJobs
              ).map((job) => {
                const totalCents =
                  BigInt(job.payPerHelperCents) + BigInt(job.transportPerHelperCents);
                const rands = (Number(totalCents) / 100).toFixed(0);
                const isCompleted =
                  job.status === "completed" || job.assignmentStatus === "completed";
                const isCancelled =
                  job.status === "cancelled" || job.assignmentStatus === "cancelled";

                return (
                  <div
                    key={`${job.bookingId}-${job.slot}`}
                    className="p-4 rounded-2xl bg-[#1E1E1E] border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-[#E87A41]" />
                        <span className="font-bold text-white text-sm">{job.suburb}</span>
                        {job.addressLine && (
                          <span className="text-xs text-neutral-400 truncate max-w-[150px]">
                            · {job.addressLine}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? "bg-emerald-500/20 text-emerald-300"
                            : isCancelled
                            ? "bg-red-500/20 text-red-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {isCompleted ? "Done" : isCancelled ? "Cancelled" : "Accepted"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-white/5">
                      <span>R{rands} Total Direct Pay</span>
                      <Link
                        href={`/helper/jobs/${job.bookingId}`}
                        className="text-[#E87A41] hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <span>View Details</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FIXED BOTTOM NAVIGATION BAR (Home & Jobs Only — Profile removed) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-white/10 px-6 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
              activeTab === "home" ? "text-[#E87A41]" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Home className="size-5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
              activeTab === "jobs" ? "text-[#E87A41]" : "text-neutral-400 hover:text-white"
            }`}
          >
            <History className="size-5" />
            <span>Jobs</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
