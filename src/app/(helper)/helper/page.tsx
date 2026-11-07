import { redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { getHelperAssignedJobs, getHelperMetrics, getHelperOfferSummaries } from "@/server/views/booking-read";
import { HelperHomeDashboard } from "@/components/HelperHomeDashboard";

export const metadata = { title: "Helper Dashboard — siZa." };

export default async function HelperAppPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const supabase = createSupabaseAdminClient();
  const [{ data: profile }, { data: helperDetails }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", actor.userId)
      .maybeSingle(),
    supabase
      .from("helper_details")
      .select("status, suburbs, services, job_title, bio, first_job_completed_at, subscription_status, subscription_paid_until, id_number_encrypted")
      .eq("user_id", actor.userId)
      .maybeSingle(),
  ]);

  // If onboarding not completed yet, route directly to onboarding questionnaire
  if (!helperDetails || !helperDetails.id_number_encrypted || !helperDetails.suburbs || helperDetails.suburbs.length === 0) {
    redirect("/helper/onboarding");
  }

  // If application is awaiting admin review, show polite status gate and prevent offer queries
  if (helperDetails.status !== "approved") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-neutral-950/80 border border-white/15 backdrop-blur-xl text-center space-y-6 shadow-2xl">
          <div className="size-16 rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold font-mono">⏳</span>
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider font-mono">
              Status: Application Under Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Application Under Review
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We review every helper profile before opening access to fair rotation job offers. Our admin team will verify your details and activate your account shortly.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-1 text-left">
            <p><strong>Registered Name:</strong> {profile?.first_name} {profile?.last_name}</p>
            <p><strong>Suburbs Selected:</strong> {helperDetails.suburbs.join(", ") || "None"}</p>
            <p><strong>Services:</strong> {helperDetails.services.join(", ")}</p>
          </div>
          <div className="pt-2">
            <a
              href="https://wa.me/27820000000?text=Hi%20siZa%20Admin,%20checking%20on%20my%20helper%20application%20status"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-neutral-300 hover:text-white transition-colors"
            >
              Need to follow up? Contact Admin on WhatsApp →
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Helper is approved: fetch active offers, assigned jobs, and metrics
  const [offersResult, assignedResult, metricsResult] = await Promise.all([
    getHelperOfferSummaries(),
    getHelperAssignedJobs(),
    getHelperMetrics(),
  ]);

  const mappedProfile = profile
    ? {
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
      }
    : null;

  const mappedHelper = helperDetails
    ? {
        id: actor.userId,
        status: helperDetails.status,
        suburbs: helperDetails.suburbs ?? [],
        services: helperDetails.services ?? [],
        jobTitle: helperDetails.job_title,
        bio: helperDetails.bio,
        firstJobCompletedAt: helperDetails.first_job_completed_at,
        subscriptionStatus: helperDetails.subscription_status,
        subscriptionPaidUntil: helperDetails.subscription_paid_until,
      }
    : null;

  const offers = offersResult.ok ? offersResult.data : [];
  const assignedJobs = assignedResult.ok ? assignedResult.data : [];
  const metrics = metricsResult.ok ? metricsResult.data : null;

  return (
    <HelperHomeDashboard
      profile={mappedProfile}
      helper={mappedHelper}
      offers={offers}
      assignedJobs={assignedJobs}
      metrics={metrics}
    />
  );
}
