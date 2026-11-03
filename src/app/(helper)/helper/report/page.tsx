import { randomUUID } from "node:crypto";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";

export const metadata = { title: "Report an Issue — siZa." };

export default async function HelperReportPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const params = await searchParams;

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
          className="object-cover object-center filter brightness-[0.35] contrast-[1.15] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 backdrop-blur-[2px]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-gradient-to-b from-white/10 to-transparent blur-3xl opacity-50 rounded-full"
        />
      </div>

      {/* Space-login liquid glass card */}
      <div className="relative z-10 w-full max-w-[500px] my-auto mx-auto p-7 sm:p-10 rounded-3xl bg-neutral-950/75 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent">
        {/* Brand Eyebrow Pill */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/helper"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-wider text-neutral-300 hover:text-white transition-colors uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            siZa. Support
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Report
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {t("phase_a.report.title")}
        </h1>
        <p className="text-sm text-neutral-200 mt-2 leading-relaxed font-normal">
          {t("phase_a.report.body")}
        </p>

        {params.bookingId ? (
          <form
            className="phase-a-form mt-6 space-y-4"
            action="/api/reports"
            method="post"
          >
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <input type="hidden" name="bookingId" value={params.bookingId} />

            <div className="space-y-1.5">
              <label
                htmlFor="category"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                {t("phase_a.report.category")}
              </label>
              <select
                id="category"
                name="category"
                defaultValue="other"
                className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white backdrop-blur-md transition-all text-sm outline-none cursor-pointer [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                <option value="no_show">{t("phase_a.report.no_show")}</option>
                <option value="safety">{t("phase_a.report.safety")}</option>
                <option value="payment">{t("phase_a.report.payment")}</option>
                <option value="conduct">{t("phase_a.report.conduct")}</option>
                <option value="other">{t("phase_a.report.other")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reportText"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                {t("phase_a.report.what_happened")}
              </label>
              <textarea
                id="reportText"
                name="text"
                required
                maxLength={3000}
                rows={5}
                placeholder="Please describe what happened in detail..."
                className="w-full p-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white placeholder:text-neutral-500 backdrop-blur-md transition-all text-sm outline-none resize-none"
              />
            </div>

            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center mt-2"
              type="submit"
            >
              {t("button.submit")}
            </button>
          </form>
        ) : (
          <div className="mt-8 p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2">
            <p className="starter-copy text-sm text-neutral-300 font-medium">
              {t("phase_a.report.booking_required")}
            </p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <Link
            href="/helper"
            className="hover:text-white underline underline-offset-4 transition-colors"
          >
            ← Back to helper dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
