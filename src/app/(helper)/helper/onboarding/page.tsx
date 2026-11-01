import { redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseServerClient } from "@/server/db/server";
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

  // Fetch first name from user metadata (best-effort — falls back to "there")
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ?? undefined;

  return <HelperOnboardingForm firstName={firstName} />;
}
