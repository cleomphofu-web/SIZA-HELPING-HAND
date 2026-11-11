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
  Flag,
  Settings,
  Check,
} from "lucide-react";
import type { HelperOfferSummary } from "@/server/views/booking-read";
import type { HelperAssignedJobSummary } from "@/server/views/booking";
import type { HelperMetrics } from "@/server/views/booking-read";
import { HelperSubscriptionBanner } from "@/components/HelperSubscriptionBanner";
import { GooeyLocationSetter } from "@/components/ui/gooey-location-setter";
import { ExpandableJobFeed } from "@/components/ui/expandable-job-card";

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
              Helper
            </span>
          </div>
          <div className="flex items-center gap-2">
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

      {/* TAB 1: HOME (LOCATION & LIVE JOBS FEED) */}
      {activeTab === "home" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
          {/* Welcome & Location Setter Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Johannesburg · Fair Rotation Active
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  Welcome back, {profile?.firstName ? profile.firstName : "Helper"}
                </h1>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60 self-start sm:self-auto">
                <Check className="size-3.5" />
                <span>Approved Helper</span>
              </div>
            </div>

            {/* Component 3: Morphing / Gooey Location Setter */}
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

          {/* Active Jobs Quick Access */}
          {activeAssignments.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <KeyRound className="size-4 text-emerald-600" />
                  <span>In-Progress &amp; Check-In ({activeAssignments.length})</span>
                </h2>
              </div>
              <div className="space-y-2.5">
                {activeAssignments.map((job) => {
                  const totalCents =
                    BigInt(job.payPerHelperCents) + BigInt(job.transportPerHelperCents);
                  const rands = (Number(totalCents) / 100).toFixed(0);
                  return (
                    <Link
                      key={`${job.bookingId}-${job.slot}`}
                      href={`/helper/jobs/${job.bookingId}`}
                      className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <KeyRound className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                            {job.suburb}
                          </p>
                          <p className="text-xs text-neutral-600">
                            R{rands} Total Pay · Enter Host Code
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <span>Available Jobs Near You</span>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Showing requests near {currentLocation}
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
              />
            ) : (
              <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center space-y-3">
                <Clock className="size-8 text-neutral-400 mx-auto" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  No open jobs in {currentLocation} right now
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  When hosts book in this area, jobs appear here automatically via fair rotation.
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

          {/* Quick Metrics Bar */}
          {metrics && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 text-center space-y-1 shadow-sm">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Done</span>
                <p className="text-xl font-bold text-neutral-900">{metrics.completedJobs}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 text-center space-y-1 shadow-sm">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Active</span>
                <p className="text-xl font-bold text-black">
                  {metrics.acceptedJobs - metrics.completedJobs}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 text-center space-y-1 shadow-sm">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Earned</span>
                <p className="text-xl font-bold text-emerald-700">
                  R{(metrics.totalEarningsCents / 100).toFixed(0)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JOBS (ACCEPTED, DONE, AND DECLINED ACTIVITY HISTORY) */}
      {activeTab === "jobs" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
            <div className="border-b border-neutral-100 pb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Job Activity</h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                History of accepted, completed, and past jobs
              </p>
            </div>

            {/* Sub-filter tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200/80 max-w-sm">
              <button
                type="button"
                onClick={() => setJobsSubFilter("active")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  jobsSubFilter === "active"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                Active ({activeAssignments.length})
              </button>
              <button
                type="button"
                onClick={() => setJobsSubFilter("completed")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  jobsSubFilter === "completed"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                Done ({completedAssignments.length})
              </button>
              <button
                type="button"
                onClick={() => setJobsSubFilter("all")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  jobsSubFilter === "all"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                All ({assignedJobs.length})
              </button>
            </div>

            {/* Jobs List */}
            <div className="space-y-3">
              {assignedJobs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center space-y-2">
                  <Clock className="size-8 text-neutral-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-neutral-900">No jobs recorded yet</h3>
                  <p className="text-xs text-neutral-500">
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
                      className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-black" />
                          <span className="font-bold text-neutral-900 text-sm">{job.suburb}</span>
                          {job.addressLine && (
                            <span className="text-xs text-neutral-500 truncate max-w-[180px]">
                              · {job.addressLine}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : isCancelled
                              ? "bg-red-50 text-red-800 border-red-200"
                              : "bg-neutral-200 text-neutral-800 border-neutral-300"
                          }`}
                        >
                          {isCompleted ? "Done" : isCancelled ? "Cancelled" : "Accepted"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-600 pt-2 border-t border-neutral-200/60">
                        <span>R{rands} Total Direct Pay</span>
                        <Link
                          href={`/helper/jobs/${job.bookingId}`}
                          className="text-black hover:underline font-semibold flex items-center gap-0.5"
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
        </div>
      )}

      {/* FIXED BOTTOM FLOATING NAVIGATION DOCK (SIZA Pill Style — Home & Jobs Only) */}
      <nav
        aria-label="Helper Navigation"
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

        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer ${
            activeTab === "home"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
          aria-current={activeTab === "home" ? "page" : undefined}
        >
          <Home className="size-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer ${
            activeTab === "jobs"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
          aria-current={activeTab === "jobs" ? "page" : undefined}
        >
          <History className="size-4" />
          <span>Jobs</span>
        </button>
      </nav>
    </main>
  );
}
