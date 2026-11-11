import { redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseServerClient } from "@/server/db/server";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { HelperOnboardingForm } from "@/components/HelperOnboardingForm";

export const metadata = { title: "Helper setup — siZa." };

export default async function HelperOnboardingPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  // If already onboarded (pending, approved, or declined), redirect to helper dashboard / status gate
  const adminClient = createSupabaseAdminClient();
  const { data: helperDetails } = await adminClient
    .from("helper_details")
    .select("suburbs, status")
    .eq("user_id", actor.userId)
    .maybeSingle();

  if (helperDetails && helperDetails.suburbs && helperDetails.suburbs.length > 0) {
    redirect("/helper");
  }

  // Fetch first name from user metadata (best-effort — falls back to "there")
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ?? undefined;

  return <HelperOnboardingForm firstName={firstName} />;
}
