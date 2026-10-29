import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { AdminMfaSetupForm } from "@/components/AdminMfaSetupForm";
import { requireAdminIdentity } from "@/server/policies/auth";
import { adminSessionRequiresMfa } from "@/server/services/admin-mfa";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMfaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireAdminIdentity();
  const [{ data: factors, error: factorError }, { data: assurance, error: assuranceError }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!factorError && !assuranceError && factors && !adminSessionRequiresMfa(assurance.currentLevel)) redirect("/admin");

  const verifiedFactor = factors?.totp.find((factor) => factor.status === "verified");
  return (
    <main className="min-h-screen bg-[#191919] text-[#ffffff]">
      <div className="siza-shell grid min-h-screen items-center py-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
        <div><p className="siza-label mt-16 text-[#e6e6e6]">SIZA / admin</p><h1 id="admin-mfa-title" className="admin-title text-[#ffffff]">{t("admin.mfa.title")}</h1></div>
        {factorError || assuranceError || !factors ? <p role="alert">{t("admin.mfa.setup.error")}</p> : <AdminMfaSetupForm factorId={verifiedFactor?.id ?? null} error={params.error === "invalid"} />}
      </div>
    </main>
  );
}
