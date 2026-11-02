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
  const [{ data: profile }, { data: helperDetails }, offersResult, assignedResult, metricsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", actor.userId)
      .maybeSingle(),
    supabase
      .from("helper_details")
      .select("status, suburbs, services, job_title, bio, first_job_completed_at, subscription_status, subscription_paid_until")
      .eq("user_id", actor.userId)
      .maybeSingle(),
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
