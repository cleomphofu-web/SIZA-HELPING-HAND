import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Coffee } from "lucide-react";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";
import { getHelperOfferSummaries } from "@/server/views/booking-read";

export const metadata = { title: "Available Jobs — siZa." };

export default async function HelperJobsPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const result = await getHelperOfferSummaries();
  const offers = result.ok ? result.data : [];

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
      <div className="relative z-10 w-full max-w-[540px] my-auto mx-auto p-7 sm:p-10 rounded-3xl bg-neutral-950/75 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent">
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
            {offers.length} {offers.length === 1 ? "offer" : "offers"}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {t("helper.jobs.title")}
        </h1>
        <p className="starter-copy text-sm text-neutral-300 mt-2 leading-relaxed">
          Open job offers in your service areas. Jobs are awarded to the first helper who accepts.
        </p>

        {offers.length ? (
          <ul className="phase-a-list mt-6 space-y-3">
            {offers.map((offer) => {
              const amount = (
                (Number(offer.payPerHelperCents) +
                  Number(offer.transportPerHelperCents)) /
                100
              ).toLocaleString("en-ZA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              return (
                <li
                  key={`${offer.id}-${offer.slot}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md"
                >
                  <div className="space-y-1">
                    <strong className="text-sm font-semibold text-white flex items-center">
                      <MapPin className="size-3.5 text-emerald-400 inline mr-1 flex-shrink-0" />
                      {offer.suburb}
                    </strong>
                    <span className="text-xs text-neutral-300 font-medium">
                      {t("helper.jobs.you_receive", { amount })}
                    </span>
                  </div>
                  <form
                    action="/api/helper/jobs/accept"
                    method="post"
                    className="w-full sm:w-auto"
                  >
                    <input type="hidden" name="bookingId" value={offer.id} />
                    <input type="hidden" name="slot" value={offer.slot} />
                    <button
                      className="w-full sm:w-auto px-5 h-10 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-md"
                      type="submit"
                    >
                      {t("helper.jobs.accept")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-8 p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2">
            <Coffee className="size-8 text-neutral-400 mx-auto" />
            <p className="text-sm text-neutral-200 font-medium">
              {t("phase_a.empty_jobs")}
            </p>
            <p className="text-xs text-neutral-400">
              New offers appear here automatically as hosts create requests.
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
