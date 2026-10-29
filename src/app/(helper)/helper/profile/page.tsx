import { redirect } from "next/navigation";
import { HelperGenderMatchingForm, type HelperMatchingNotice } from "@/components/HelperGenderMatchingForm";
import { getOwnHelperMatchingView } from "@/server/views/helper-matching-read";

type HelperProfilePageProps = { searchParams: Promise<{ matching?: string | string[] }> };

export default async function HelperProfilePage({ searchParams }: HelperProfilePageProps) {
  const [result, query] = await Promise.all([getOwnHelperMatchingView(), searchParams]);
  if (!result.ok) {
    if (result.error.code === "unauthenticated") redirect("/login");
    if (result.error.code === "not_found") redirect("/helper/onboarding");
    redirect("/helper");
  }
  const status: HelperMatchingNotice | undefined = query.matching === "saved" || query.matching === "failed" || query.matching === "rate_limited" || query.matching === "unavailable"
    ? query.matching
    : undefined;
  return <HelperGenderMatchingForm enabled={result.data.enabled} currentGroup={result.data.genderMatchGroup} status={status} />;
}
