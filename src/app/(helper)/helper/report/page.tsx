import { randomUUID } from "node:crypto";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";

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
  const supabase = createSupabaseAdminClient();

  // Fetch helper's recent bookings so they can pick a booking if none is in the query params
  const { data: assignments } = await supabase
    .from("booking_assignments")
    .select("booking_id, status, created_at")
    .eq("helper_id", actor.userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const bookingIds = (assignments ?? []).map((a) => a.booking_id);
  const { data: bookingRows } = bookingIds.length > 0
    ? await supabase
        .from("phase_a_bookings")
        .select("id, suburb, start_at, status")
        .in("id", bookingIds)
    : { data: [] };

  const bookingsMap = new Map((bookingRows ?? []).map((b) => [b.id, b]));
  const availableBookings = (assignments ?? []).map((a) => {
    const booking = bookingsMap.get(a.booking_id);
    return {
      bookingId: a.booking_id,
      suburb: booking?.suburb || "Booking",
      startAt: booking?.start_at ? new Date(booking.start_at).toLocaleDateString("en-ZA") : "",
      status: a.status,
    };
  });

  if (params.bookingId && !availableBookings.some((b) => b.bookingId === params.bookingId)) {
    availableBookings.unshift({
      bookingId: params.bookingId,
      suburb: "Current Booking",
      startAt: "",
      status: "selected",
    });
  }

  const activeBookingId = params.bookingId || (availableBookings[0]?.bookingId ?? "");

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-black text-white">
      {/* Background image */}
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
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[500px] my-auto mx-auto p-7 sm:p-10 rounded-3xl bg-neutral-950/75 backdrop-blur-2xl border border-white/15 shadow-2xl">
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

        {activeBookingId ? (
          <form
            className="phase-a-form mt-6 space-y-4"
            action="/api/reports?redirect=/helper?reported=true"
            method="post"
          >
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />

            {/* Booking Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="bookingId"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                Select Related Job / Booking
              </label>
              <select
                id="bookingId"
                name="bookingId"
                defaultValue={activeBookingId}
                className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] text-white text-sm outline-none cursor-pointer [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                {availableBookings.map((b) => (
                  <option key={b.bookingId} value={b.bookingId}>
                    {b.suburb} — {b.startAt} ({b.status})
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] text-white text-sm outline-none cursor-pointer [&>option]:bg-neutral-900 [&>option]:text-white"
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
                className="w-full p-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] text-white placeholder:text-neutral-500 text-sm outline-none resize-none"
              />
            </div>

            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all shadow-lg flex items-center justify-center mt-2 cursor-pointer"
              type="submit"
            >
              {t("button.submit")}
            </button>
          </form>
        ) : (
          <div className="mt-8 p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-4">
            <p className="text-sm text-neutral-300 font-medium">
              You do not have any active or past bookings to link a report to.
            </p>
            <p className="text-xs text-neutral-400">
              For general support or onboarding assistance, chat directly with Admin.
            </p>
            <a
              href="https://wa.me/27683570176?text=Hi%20siZa%20Admin,%20I%20have%20a%20support%20question."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#E87A41] text-white text-xs font-bold transition-all shadow-md"
            >
              Contact Admin on WhatsApp →
            </a>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <Link href="/helper" className="hover:text-white underline underline-offset-4">
            ← Back to helper dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
