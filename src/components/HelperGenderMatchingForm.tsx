import Image from "next/image";
import Link from "next/link";
import { t } from "@/content/t";

export type HelperMatchingNotice =
  | "saved"
  | "failed"
  | "rate_limited"
  | "unavailable";

export function HelperGenderMatchingForm({
  currentGroup,
  enabled,
  status,
}: {
  currentGroup: "female" | "male" | null;
  enabled: boolean;
  status?: HelperMatchingNotice;
}) {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-black text-white">
      {/* siZa atmospheric background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/hero/background%20home%20page%20hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.35] contrast-[1.15] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 backdrop-blur-[2px]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-gradient-to-b from-white/10 to-transparent blur-3xl opacity-50 rounded-full"
        />
      </div>

      {/* Space-login liquid glass card */}
      <section
        className="relative z-10 w-full max-w-[480px] my-auto mx-auto p-7 sm:p-10 rounded-3xl bg-neutral-950/75 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent"
        aria-labelledby="helper-matching-title"
      >
        {/* Brand Eyebrow Pill */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/helper"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-wider text-neutral-300 hover:text-white transition-colors uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            siZa. Helper
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Preferences
          </span>
        </div>

        <h1
          id="helper-matching-title"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight"
        >
          {t("helper.matching.title")}
        </h1>
        <p className="text-sm text-neutral-200 mt-2 leading-relaxed">
          {t("helper.matching.body")}
        </p>

        {status === "saved" && (
          <p
            role="status"
            className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs text-center font-medium"
          >
            {t("helper.matching.saved")}
          </p>
        )}
        {status === "failed" && (
          <p
            role="alert"
            className="mt-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-center font-medium"
          >
            {t("helper.matching.failed")}
          </p>
        )}
        {status === "rate_limited" && (
          <p
            role="alert"
            className="mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs text-center font-medium"
          >
            {t("helper.matching.rate_limited")}
          </p>
        )}
        {status === "unavailable" && (
          <p
            role="alert"
            className="mt-4 p-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs text-center"
          >
            {t("helper.matching.unavailable")}
          </p>
        )}

        {!enabled ? (
          <p
            role="status"
            className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs text-center"
          >
            {t("helper.matching.unavailable")}
          </p>
        ) : (
          <form
            className="phase-a-form mt-6 space-y-4"
            action="/api/helper/profile/matching-preference"
            method="post"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="genderMatchGroup"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                {t("helper.matching.choice")}
              </label>
              <select
                id="genderMatchGroup"
                name="genderMatchGroup"
                defaultValue={currentGroup ?? "none"}
                className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white backdrop-blur-md transition-all text-sm outline-none cursor-pointer [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                <option value="none">{t("helper.matching.none")}</option>
                <option value="female">{t("helper.matching.female")}</option>
                <option value="male">{t("helper.matching.male")}</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="consent"
                  defaultChecked={currentGroup !== null}
                  className="mt-0.5 size-4 rounded border-white/30 bg-white/10 text-black focus:ring-white/30"
                />
                <span className="text-xs text-neutral-300 leading-relaxed group-hover:text-white transition-colors">
                  {t("helper.matching.consent")}
                </span>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
              <p className="phase-a-help text-xs text-neutral-400 leading-relaxed">
                {t("helper.matching.privacy")}
              </p>
            </div>

            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center mt-2"
              type="submit"
            >
              {t("button.save")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
