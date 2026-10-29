import { redirect } from "next/navigation";
import { HostProfileForm } from "@/components/HostProfileForm";
import { getOwnHostProfileView } from "@/server/views/host-profile-read";

export default async function HostOnboardingPage() {
  const result = await getOwnHostProfileView();
  if (!result.ok) redirect(result.error.code === "unauthenticated" ? "/login" : "/");
  return <HostProfileForm profile={result.data} titleKey="host.onboarding.title" />;
}
