import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { t } from "@/content/t";
import { KycForm } from "@/components/KycForm";

export const metadata = { title: "Identity Verification — siZa." };

type KycStatus = "pending" | "verified" | "failed" | "none";

export default async function HelperKycPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const adminDb = createSupabaseAdminClient();

  // Load latest KYC status
  const { data: kycRow } = await adminDb
    .from("kyc_verifications")
    .select("status, popia_consent_at")
    .eq("helper_id", actor.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentStatus: KycStatus = kycRow
    ? (kycRow.status as KycStatus)
    : "none";
  const hasConsent = !!kycRow?.popia_consent_at;

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans">
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-lg font-bold tracking-tighter">siZa.</span>
          <span className="text-white/30" aria-hidden="true">/</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Identity Verification
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-7 text-emerald-600 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                {t("kyc.title")}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {t("kyc.body")}
              </p>
            </div>
          </div>

          <KycForm currentStatus={currentStatus} hasConsent={hasConsent} />
        </div>
      </div>
    </main>
  );
}

