import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";
import { getBookingView } from "@/server/views/booking-read";

export default async function HelperJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const { id } = await params;
  const result = await getBookingView(id);
  if (!result.ok || result.data.audience !== "helper" || !result.data.address) {
    notFound();
  }
  const booking = result.data;

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
          <Link
            href="/helper/jobs"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-wider text-neutral-300 hover:text-white transition-colors uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            siZa. Helper
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Assigned Job
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {booking.suburb}
        </h1>
        <p className="text-sm text-neutral-200 mt-2 leading-relaxed font-normal">
          {booking.address}
        </p>

        {!booking.checkedInAt ? (
          <form
            className="phase-a-form mt-6 space-y-4"
            action="/api/helper/jobs/check-in"
            method="post"
          >
            <input type="hidden" name="bookingId" value={booking.id} />
            <div className="space-y-1.5">
              <label
                htmlFor="checkinCode"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                {t("phase_a.check_in.title")}
              </label>
              <input
                id="checkinCode"
                name="code"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6-digit code from host"
                className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white placeholder:text-neutral-500 backdrop-blur-md transition-all text-center tracking-widest text-lg font-mono outline-none"
              />
            </div>
            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center mt-2"
              type="submit"
            >
              {t("helper.mine.checkin")}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <form action="/api/bookings/confirm" method="post">
              <input type="hidden" name="bookingId" value={booking.id} />
              <button
                className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center"
                type="submit"
              >
                {t("helper.mine.finish")}
              </button>
            </form>
            <Link
              className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs uppercase tracking-wider flex items-center justify-center transition-all"
              href={`/helper/report?bookingId=${booking.id}`}
            >
              {t("host.request.report")}
            </Link>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <Link
            href="/helper/jobs"
            className="hover:text-white underline underline-offset-4 transition-colors"
          >
            ← Back to jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
