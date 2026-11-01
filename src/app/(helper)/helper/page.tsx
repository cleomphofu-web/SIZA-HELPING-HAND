import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";

export const metadata = { title: "Helper Dashboard — siZa." };

export default async function HelperAppPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-black text-white">
      {/* SIZA atmospheric background image */}
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold tracking-wider text-neutral-300 uppercase">
              siZa. Helper
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Active
          </span>
        </div>

        {/* Heading & Subtitle in crystal clear, readable text */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          {t("helper.app.title")}
        </h1>
        <p className="starter-copy text-sm sm:text-base text-neutral-300 mt-2.5 leading-relaxed font-normal">
          {t("helper.app.body")}
        </p>

        {/* Action Options in Sleek Liquid Glass Cards */}
        <div className="mt-8 space-y-3.5">
          {/* Complete / Edit Profile */}
          <Link
            href="/helper/onboarding"
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all text-left shadow-sm active:scale-[0.99]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {t("helper.onboarding.title")}
                </span>
              </div>
              <p className="text-xs text-neutral-400 pl-6">
                Update suburbs, services, and identity documents
              </p>
            </div>
            <span className="text-neutral-400 group-hover:text-white transition-transform group-hover:translate-x-1 text-base ml-2">
              →
            </span>
          </Link>

          {/* Job Offers */}
          <Link
            href="/helper/jobs"
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all text-left shadow-sm active:scale-[0.99]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">💼</span>
                <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {t("helper.jobs.title")}
                </span>
              </div>
              <p className="text-xs text-neutral-400 pl-6">
                See offers in your areas and accept jobs
              </p>
            </div>
            <span className="text-neutral-400 group-hover:text-white transition-transform group-hover:translate-x-1 text-base ml-2">
              →
            </span>
          </Link>

          {/* Optional Matching Preference */}
          <Link
            href="/helper/profile"
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all text-left shadow-sm active:scale-[0.99]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {t("helper.matching.title")}
                </span>
              </div>
              <p className="text-xs text-neutral-400 pl-6">
                Optional matching preferences
              </p>
            </div>
            <span className="text-neutral-400 group-hover:text-white transition-transform group-hover:translate-x-1 text-base ml-2">
              →
            </span>
          </Link>
        </div>

        {/* Bottom sign out / home switch */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <span>Signed in as helper</span>
          <Link
            href="/"
            className="text-neutral-300 hover:text-white underline underline-offset-4 transition-colors"
          >
            Public home
          </Link>
        </div>
      </div>
    </main>
  );
}
