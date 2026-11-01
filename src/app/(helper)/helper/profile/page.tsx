import { redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { HelperSocialProfile } from "@/components/HelperSocialProfile";

export const metadata = { title: "My Profile — siZa." };

export default async function HelperProfilePage() {
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
      .select("id, first_name, last_name, phone")
      .eq("id", actor.userId)
      .maybeSingle(),
    supabase
      .from("helper_details")
      .select("status, job_title, suburbs, services, bio")
      .eq("user_id", actor.userId)
      .maybeSingle(),
  ]);

  if (!profile) redirect("/login");

  const profileData = {
    id: actor.userId,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    jobTitle: helperDetails?.job_title || "Professional Helper",
    suburbs: helperDetails?.suburbs ?? [],
    services: helperDetails?.services ?? [],
    bio: helperDetails?.bio ?? "",
    status: helperDetails?.status ?? "pending",
  };

  return <HelperSocialProfile profile={profileData} />;
}
