import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  Navigation,
} from "lucide-react";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";
import { getBookingView } from "@/server/views/booking-read";

export default async function HelperJobDetailPage({
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
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/helper"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Job Specifications
            </span>
          </div>
          <Link
            href="/helper/jobs"
            className="text-xs font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            ← Back to jobs
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* Job Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Confirmed Job Details
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                {booking.suburb}
              </h1>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
              <CheckCircle2 className="size-3.5" />
              {booking.checkedInAt ? "Checked In" : "Assigned to You"}
            </span>
          </div>

          {/* Location & Access Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Navigation className="size-3.5 text-emerald-600" />
                Service Address
              </span>
              <p className="font-semibold text-neutral-900 leading-relaxed">
                {booking.address}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Clock className="size-3.5 text-neutral-400" />
                Host & Arrival Contact
              </span>
              <p className="font-medium text-neutral-800 text-xs leading-relaxed">
                {booking.hostFirstName ? `${booking.hostFirstName} (${booking.hostPhone || "Direct contact"})` : "Contact details confirmed"}
              </p>
            </div>
          </div>
        </div>

        {/* Check-In / Completion Action Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
          {!booking.checkedInAt ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <KeyRound className="size-5 text-emerald-600" />
                  Enter 6-Digit Check-In Code
                </h2>
                <p className="text-xs text-neutral-500">
                  Ask the host for the 6-digit check-in code shown on their screen upon your arrival.
                </p>
              </div>

              <form
                action="/api/helper/jobs/check-in"
                method="post"
                className="space-y-4 max-w-sm"
              >
                <input type="hidden" name="bookingId" value={booking.id} />
                <input
                  id="checkinCode"
                  name="code"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="••••••"
                  className="w-full h-14 px-4 rounded-2xl bg-neutral-50 border border-neutral-300 focus:border-black focus:ring-1 focus:ring-black text-center tracking-[0.5em] text-2xl font-mono text-neutral-900 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Confirm Arrival & Check In
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold">You are checked in!</p>
                  <p className="text-xs text-emerald-700">
                    Once the cleaning is done and host inspects the work, confirm completion below.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <form action="/api/bookings/confirm" method="post">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button
                    type="submit"
                    className="px-6 h-12 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Complete Job
                  </button>
                </form>

                <Link
                  href={`/helper/report?bookingId=${booking.id}`}
                  className="inline-flex items-center gap-2 px-5 h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
                >
                  <ShieldAlert className="size-4 text-neutral-500" />
                  <span>Report an Issue</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
