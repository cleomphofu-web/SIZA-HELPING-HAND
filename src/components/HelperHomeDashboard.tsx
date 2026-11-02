import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Settings,
  User,
  Search,
  Banknote,
  Flag,
  KeyRound,
  Navigation,
} from "lucide-react";
import type { HelperOfferSummary } from "@/server/views/booking-read";
import type { HelperAssignedJobSummary } from "@/server/views/booking";

type HelperHomeDashboardProps = {
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  helper: {
    status: string;
    suburbs: string[];
    services: string[];
    jobTitle: string;
    bio: string | null;
  } | null;
  offers: HelperOfferSummary[];
  assignedJobs?: HelperAssignedJobSummary[];
};

const guideCards = [
  {
    title: "Fair Rotation Offers",
    badge: "First to Accept",
    accent: "from-neutral-900 via-neutral-800 to-neutral-700",
    description: "Job requests are offered fairly to approved helpers in the area. The first to accept is assigned to the booking.",
    icon: Sparkles,
  },
  {
    title: "Arrival Check-in Code",
    badge: "Host Code",
    accent: "from-stone-900 via-stone-800 to-neutral-700",
    description: "When you arrive at the booking address, ask the host for their 6-digit check-in code to confirm your arrival.",
    icon: ShieldCheck,
  },
  {
    title: "100% Direct Payment",
    badge: "Zero Deductions",
    accent: "from-zinc-900 via-zinc-800 to-neutral-700",
    description: "Hosts pay your full wage and transport allowance directly upon completion. SIZA never skims your earnings.",
    icon: Banknote,
  },
  {
    title: "Support & Reporting",
    badge: "Safety First",
    accent: "from-neutral-900 via-stone-800 to-neutral-800",
    description: "If an address is unreachable, unsafe, or cancelled, submit an immediate report from your dashboard.",
    icon: Flag,
  },
];

export function HelperHomeDashboard({ profile, helper, offers, assignedJobs = [] }: HelperHomeDashboardProps) {
  const isApproved = helper?.status === "approved";
  const isPending = helper?.status === "pending" || !helper;
  const suburbsCount = helper?.suburbs?.length ?? 0;
  const servicesCount = helper?.services?.length ?? 0;

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans">
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
              href="/helper/profile"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <User className="size-3.5" />
              <span>Profile</span>
            </Link>
            <Link
              href="/helper/account"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <Settings className="size-3.5" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mb-3">
              {profile?.firstName ? `Welcome back, ${profile.firstName}` : "Your Helper Workspace"}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 leading-relaxed">
              Manage your profile, browse available job requests, and keep your work details up to date.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/helper/jobs"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] cursor-pointer"
              >
                <Search className="size-4" />
                <span>Search & View Jobs</span>
                <ArrowRight className="size-4 ml-0.5 opacity-90" />
              </Link>
              <Link
                href="/helper/profile"
                className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-xl text-neutral-800 hover:text-black hover:bg-neutral-100 text-sm font-semibold transition-colors border border-neutral-300 shadow-sm"
              >
                <User className="size-4 text-neutral-500" />
                <span>View My Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status Card */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Account Status
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {helper?.status ?? "Incomplete"}
              </span>
            </div>
            <p className="text-xl font-bold tracking-tight text-neutral-900">
              {isApproved ? "Approved & Active" : isPending ? "Under Review" : "Action Needed"}
            </p>
            <p className="text-xs text-neutral-500">
              {isApproved
                ? "You receive rotation offers automatically"
                : "Admin verification in progress"}
            </p>
          </div>

          {/* Suburbs Coverage */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Coverage
              </span>
              <MapPin className="size-4 text-neutral-400" />
            </div>
            <p className="text-xl font-bold tracking-tight text-neutral-900">
              {suburbsCount} {suburbsCount === 1 ? "Suburb" : "Suburbs"}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {helper?.suburbs?.length ? helper.suburbs.slice(0, 3).join(", ") : "No suburbs chosen"}
            </p>
          </div>

          {/* Direct Earnings */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Earnings
              </span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold tracking-tight text-neutral-900">
              100% Direct Pay
            </p>
            <p className="text-xs text-neutral-500">
              Hosts pay you directly with zero fee skim
            </p>
          </div>
        </section>

        {/* My Assigned / Active Jobs Section */}
        {assignedJobs.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                    My Assigned Jobs & Check-In
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Accepted jobs waiting for arrival check-in or completion
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono text-xs font-semibold">
                {assignedJobs.length} {assignedJobs.length === 1 ? "Active Job" : "Active Jobs"}
              </span>
            </div>

            <div className="space-y-4">
              {assignedJobs.map((job) => {
                const totalCents = BigInt(job.payPerHelperCents) + BigInt(job.transportPerHelperCents);
                const rands = (Number(totalCents) / 100).toFixed(0);
                const isCheckedIn = Boolean(job.checkedInAt);
                const isCompleted = job.status === "completed" || job.assignmentStatus === "completed";

                return (
                  <div
                    key={`${job.bookingId}-${job.slot}`}
                    className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 hover:border-black/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-neutral-900 text-base">
                          {job.suburb}
                        </span>
                        {job.addressLine && (
                          <span className="text-xs text-neutral-500">
                            · {job.addressLine}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        <span>Slot #{job.slot}</span>
                        <span>·</span>
                        <span className="font-semibold text-neutral-900">R{rands} Total Pay</span>
                        <span>·</span>
                        <span className="capitalize">{job.status.replace("_", " ")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {!isCheckedIn && !isCompleted ? (
                        <Link
                          href={`/helper/jobs/${job.bookingId}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
                        >
                          <KeyRound className="size-3.5" />
                          <span>Enter Check-In Code →</span>
                        </Link>
                      ) : isCompleted ? (
                        <Link
                          href={`/helper/jobs/${job.bookingId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-xs transition-colors"
                        >
                          <CheckCircle2 className="size-3.5 text-neutral-600" />
                          <span>View Completed Job</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/helper/jobs/${job.bookingId}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                          <span>Checked In · Complete Job →</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Incoming Job Offers Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="size-5 text-neutral-700" />
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                Available Job Offers
              </h2>
            </div>
            {offers.length > 0 && (
              <Link
                href="/helper/jobs"
                className="text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
              >
                View all offers &rarr;
              </Link>
            )}
          </div>

          {offers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offers.map((offer) => {
                const totalCents = BigInt(offer.payPerHelperCents) + BigInt(offer.transportPerHelperCents);
                const rands = (Number(totalCents) / 100).toFixed(0);
                return (
                  <div
                    key={`${offer.id}-${offer.slot}`}
                    className="p-5 rounded-2xl border border-neutral-200 hover:border-black/30 transition-all space-y-3 bg-neutral-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        {offer.suburb}
                      </span>
                      <span className="text-base font-bold text-neutral-900">
                        R{rands}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Slot #{offer.slot} · Includes pay and transport allowance
                    </p>
                    <Link
                      href="/helper/jobs"
                      className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      Review & Accept Offer →
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-100 text-center space-y-3">
              <Clock className="size-8 text-neutral-400 mx-auto" />
              <h3 className="text-sm font-semibold text-neutral-900">
                No pending job offers right now
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                When hosts request cleaning in your selected suburbs, offers appear here automatically via fair rotation.
              </p>
              <Link
                href="/helper/jobs"
                className="inline-block mt-2 text-xs font-semibold text-black underline underline-offset-4"
              >
                Check jobs page
              </Link>
            </div>
          )}
        </section>

        {/* Operating Standards & Guidelines */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-lg font-bold tracking-tight text-neutral-900">
              How SIZA Works For Helpers
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Everything you need to know about accepting jobs, check-ins, and payments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guideCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl bg-gradient-to-br ${card.accent} p-6 text-white flex flex-col justify-between shadow-sm space-y-4`}
                >
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/15">
                      {card.badge}
                    </span>
                    <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                      <Icon className="size-5 text-white/90" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Tools & Settings */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/helper/profile"
            className="group p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-black/30 transition-all shadow-sm space-y-2 block"
          >
            <div className="size-9 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <User className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-black">
              Profile & Bio
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              View your public bio, work photos, and experience details.
            </p>
          </Link>

          <Link
            href="/helper/account"
            className="group p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-black/30 transition-all shadow-sm space-y-2 block"
          >
            <div className="size-9 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Settings className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-black">
              Settings & Account
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Manage your login, read helper guides, and adjust account options.
            </p>
          </Link>

          <Link
            href="/helper/report"
            className="group p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-black/30 transition-all shadow-sm space-y-2 block"
          >
            <div className="size-9 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Flag className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-black">
              Report an Issue
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Submit reports regarding cancellations, access, or payment issues.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}

