import { redirect } from "next/navigation";
import { HostProfileForm } from "@/components/HostProfileForm";
import { getOwnHostProfileView } from "@/server/views/host-profile-read";
import { getOwnHostAccountView } from "@/server/views/host-account-read";

type HostProfilePageProps = { searchParams: Promise<{ account?: string | string[] }> };

export default async function HostProfilePage({ searchParams }: HostProfilePageProps) {
  const [profileResult, accountResult, query] = await Promise.all([
    getOwnHostProfileView(),
    getOwnHostAccountView(),
    searchParams,
  ]);
  if (!profileResult.ok) redirect(profileResult.error.code === "unauthenticated" ? "/login" : "/");
  if (!accountResult.ok) redirect(accountResult.error.code === "unauthenticated" ? "/login" : "/");
  const accountNotice = query.account === "saved" || query.account === "failed" || query.account === "rate_limited"
    ? query.account
    : undefined;
  return <HostProfileForm profile={profileResult.data} account={accountResult.data} accountNotice={accountNotice} />;
}
