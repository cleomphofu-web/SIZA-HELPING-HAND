import Image from "next/image";
import Link from "next/link";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { t } from "@/content/t";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const challengeRequired = params.challenge === "1";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const errorKey =
    params.error === "try-again"
      ? "admin.login.error.try_again"
      : params.error === "invalid"
      ? "admin.login.error.invalid"
      : null;

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-black text-white">
      {/* SIZA atmospheric architectural background image */}
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
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-wider text-neutral-300 hover:text-white transition-colors uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            siZa. Admin
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
            Protected
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {t("admin.login.title")}
        </h1>
        <p className="text-sm text-neutral-300 mt-2 leading-relaxed">
          Sign in to the administrative portal with authorized credentials.
        </p>

        {errorKey ? (
          <p
            role="alert"
            className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-center font-medium"
          >
            {t(errorKey)}
          </p>
        ) : null}

        <form
          className="siza-form mt-6 space-y-4"
          action="/api/admin/login"
          method="post"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
            >
              {t("admin.login.email")}
            </label>
            <input
              id="email"
              required
              name="email"
              type="email"
              autoComplete="username"
              placeholder="admin@siza.co.za"
              className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white placeholder:text-neutral-500 backdrop-blur-md transition-all text-sm outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
            >
              {t("admin.login.password")}
            </label>
            <input
              id="password"
              required
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white placeholder:text-neutral-500 backdrop-blur-md transition-all text-sm outline-none"
            />
          </div>

          {challengeRequired ? (
            <div className="pt-2 flex justify-center">
              <TurnstileWidget siteKey={turnstileSiteKey} />
            </div>
          ) : null}

          <button
            className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            type="submit"
            disabled={challengeRequired && !turnstileSiteKey}
          >
            <span>{t("admin.login.submit")}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </main>
  );
}
