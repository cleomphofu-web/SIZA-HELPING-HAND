import { redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { getHelperAssignedJobs, getHelperOfferSummaries } from "@/server/views/booking-read";
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
  const [{ data: profile }, { data: helperDetails }, offersResult, assignedResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", actor.userId)
      .maybeSingle(),
    supabase
      .from("helper_details")
      .select("status, suburbs, services, job_title, bio")
      .eq("user_id", actor.userId)
      .maybeSingle(),
    getHelperOfferSummaries(),
    getHelperAssignedJobs(),
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
      }
    : null;

  const offers = offersResult.ok ? offersResult.data : [];
  const assignedJobs = assignedResult.ok ? assignedResult.data : [];

  return (
    <HelperHomeDashboard
      profile={mappedProfile}
      helper={mappedHelper}
      offers={offers}
      assignedJobs={assignedJobs}
    />
  );
}
