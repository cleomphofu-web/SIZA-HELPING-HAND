import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { AdminMfaSetupForm } from "@/components/AdminMfaSetupForm";
import { requireAdminIdentity } from "@/server/policies/auth";
import { adminSessionRequiresMfa } from "@/server/services/admin-mfa";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdminIdentity();
  const [{ data: factors, error: factorError }, { data: assurance, error: assuranceError }] =
    await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

  if (
    !factorError &&
    !assuranceError &&
    factors &&
    !adminSessionRequiresMfa(assurance.currentLevel)
  ) {
    redirect("/admin");
  }

  const verifiedFactor = factors?.totp.find((factor) => factor.status === "verified");

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-black text-white">
      {/* siZa atmospheric background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/hero/background%20home%20page%20hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.3] contrast-[1.2] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/95 backdrop-blur-[2px]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-gradient-to-b from-amber-500/10 via-white/5 to-transparent blur-3xl opacity-50 rounded-full"
        />
      </div>

      {/* Space-login liquid glass card */}
      <div className="relative z-10 w-full max-w-[460px] my-auto mx-auto p-7 sm:p-10 rounded-3xl bg-neutral-950/80 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent">
        {/* Brand badge */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-wider text-neutral-300 hover:text-white transition-colors uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            siZa. Admin
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
            2FA Security
          </span>
        </div>

        <h1
          id="admin-mfa-title"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight mb-2"
        >
          {t("admin.mfa.title")}
        </h1>

        {factorError || assuranceError || !factors ? (
          <p
            role="alert"
            className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-center font-medium"
          >
            {t("admin.mfa.setup.error")}
          </p>
        ) : (
          <AdminMfaSetupForm
            factorId={verifiedFactor?.id ?? null}
            error={params.error === "invalid"}
          />
        )}
      </div>
    </main>
  );
}
