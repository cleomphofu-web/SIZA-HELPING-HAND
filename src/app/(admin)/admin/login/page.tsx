import Link from "next/link";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { t } from "@/content/t";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const challengeRequired = params.challenge === "1";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const errorKey = params.error === "try-again" ? "admin.login.error.try_again" : params.error === "invalid" ? "admin.login.error.invalid" : null;
  return (
    <main className="min-h-screen bg-[#191919] text-[#ffffff]">
      <div className="siza-shell grid min-h-screen items-center py-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
        <div><Link className="siza-wordmark" href="/">siZa<span aria-hidden="true">.</span></Link><p className="siza-label mt-16 text-[#e6e6e6]">SIZA / admin</p><h1 className="admin-title text-[#ffffff]">{t("admin.login.title")}</h1></div>
        <form className="siza-form" action="/api/admin/login" method="post">
          {errorKey ? <p role="alert">{t(errorKey)}</p> : null}
          <div className="siza-field"><label htmlFor="email">{t("admin.login.email")}</label><input id="email" required name="email" type="email" autoComplete="username" /></div>
          <div className="siza-field"><label htmlFor="password">{t("admin.login.password")}</label><input id="password" required name="password" type="password" autoComplete="current-password" /></div>
          {challengeRequired ? <TurnstileWidget siteKey={turnstileSiteKey} /> : null}
          <button className="siza-button siza-button-yellow" type="submit" disabled={challengeRequired && !turnstileSiteKey}>{t("admin.login.submit")} <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </main>
  );
}
