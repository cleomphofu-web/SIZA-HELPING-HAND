import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Briefcase, CheckCircle2, Clock, ShieldCheck, KeyRound, Lock } from "lucide-react";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { canAcceptJob, type SubscriptionStatus } from "@/server/services/subscription";
import { getHelperAssignedJobs, getHelperOfferSummaries } from "@/server/views/booking-read";
import { HelperSubscriptionBanner } from "@/components/HelperSubscriptionBanner";
import { HelperJobOfferCard } from "@/components/HelperJobOfferCard";

export const metadata = { title: "Available Jobs — siZa." };

export default async function HelperJobsPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const supabase = createSupabaseAdminClient();
  const [{ data: helperDetails }, { data: profile }] = await Promise.all([
    supabase
      .from("helper_details")
      .select("status, first_job_completed_at, subscription_status, subscription_paid_until")
      .eq("user_id", actor.userId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", actor.userId)
      .maybeSingle(),
  ]);

  if (!helperDetails || helperDetails.status !== "approved") {
    redirect("/helper");
  }

  const [offersResult, assignedResult] = await Promise.all([
    getHelperOfferSummaries(),
    getHelperAssignedJobs(),
  ]);
  const offers = offersResult.ok ? offersResult.data : [];
  const assignedJobs = assignedResult.ok ? assignedResult.data : [];

  const isPastFirstJob = Boolean(helperDetails?.first_job_completed_at);
  const isSubscribed = canAcceptJob({
    firstJobCompletedAt: helperDetails?.first_job_completed_at ?? null,
    subscriptionStatus: (helperDetails?.subscription_status as SubscriptionStatus) ?? "none",
    paidUntil: helperDetails?.subscription_paid_until ? new Date(helperDetails.subscription_paid_until) : null,
    now: new Date(),
  });
  const isPaywalled = isPastFirstJob && !isSubscribed;

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
              Jobs
            </span>
          </div>
          <Link
            href="/helper"
            className="text-xs font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* Subscription / Plan Status Banner */}
        <div id="helper-subscription-section">
          <HelperSubscriptionBanner
            firstJobCompletedAt={helperDetails?.first_job_completed_at ?? null}
            subscriptionStatus={helperDetails?.subscription_status ?? "none"}
            subscriptionPaidUntil={helperDetails?.subscription_paid_until ?? null}
            helperId={actor.userId}
            helperPhone={profile?.phone}
          />
        </div>

        {/* Active & Assigned Jobs */}
        {assignedJobs.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                    My Assigned Jobs
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Jobs accepted by you. Enter check-in code upon arrival.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold font-mono">
                {assignedJobs.length} {assignedJobs.length === 1 ? "Active Job" : "Active Jobs"}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {assignedJobs.map((job) => {
                const totalCents = BigInt(job.payPerHelperCents) + BigInt(job.transportPerHelperCents);
                const amount = (Number(totalCents) / 100).toLocaleString("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                });
                const isCheckedIn = Boolean(job.checkedInAt);
                const isCompleted = job.status === "completed" || job.assignmentStatus === "completed";

                return (
                  <div
                    key={`${job.bookingId}-${job.slot}`}
                    className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 hover:border-black/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-neutral-900 text-base">
                          {job.suburb}
                        </span>
                        {job.addressLine && (
                          <span className="text-xs text-neutral-600">
                            · {job.addressLine}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        <span>Slot #{job.slot}</span>
                        <span>·</span>
                        <span className="font-semibold text-neutral-900">{amount}</span>
                        <span>·</span>
                        <span className="capitalize">{job.status.replace("_", " ")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isCheckedIn && !isCompleted ? (
                        <Link
                          href={`/helper/jobs/${job.bookingId}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
                        >
                          <KeyRound className="size-3.5" />
                          <span>Enter Check-In Code →</span>
                        </Link>
                      ) : isCompleted ? (
                        <Link
                          href={`/helper/jobs/${job.bookingId}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-xs transition-colors"
                        >
                          <CheckCircle2 className="size-3.5 text-neutral-600" />
                          <span>View Completed</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/helper/jobs/${job.bookingId}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                          <span>Checked In · Complete →</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Title Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Briefcase className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  Available Job Offers
                </h1>
                <p className="text-xs text-neutral-500">
                  Jobs offered to helpers in your suburbs via fair rotation
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 font-mono">
              {offers.length} {offers.length === 1 ? "Offer" : "Offers"}
            </span>
          </div>
        </div>

        {/* Available Offers Grid / Locked Paywall */}
        {isPaywalled ? (
          <div className="bg-white rounded-3xl border-2 border-amber-300/80 shadow-sm p-8 sm:p-12 text-center space-y-4">
            <div className="size-16 rounded-3xl bg-amber-500/15 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="size-8 text-amber-700" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider font-mono">
                Introductory Free Job Completed
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                Unlock Available Jobs & Fair Rotation
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                You have completed your free first job! To keep seeing available jobs in your suburbs and receiving fair rotation offers, activate your helper monthly plan for a fixed fee of <strong>R120</strong> above.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="#helper-subscription-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <span>Follow 3-Step Guide Above →</span>
              </a>
            </div>
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <HelperJobOfferCard
                key={`${offer.id}-${offer.slot}`}
                offer={offer}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-12 text-center space-y-3">
            <Clock className="size-10 text-neutral-400 mx-auto" />
            <h2 className="text-base font-bold text-neutral-900">
              No Available Jobs at this Moment
            </h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              As soon as a host books cleaning services in your selected suburbs, offers are dispatched fairly and will appear here.
            </p>
          </div>
        )}

        {/* Guide Notice */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-start gap-3">
          <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-900">
              Fair Rotation Policy
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              When you click &ldquo;Approve & Accept&rdquo;, the job is immediately assigned to you, and the host&apos;s full address and arrival details will be revealed on your job confirmation page.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
