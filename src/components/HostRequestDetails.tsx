import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, KeyRound, ShieldAlert, PhoneCall, RefreshCw, Star } from "lucide-react";
import { CheckInCodeForm } from "@/components/CheckInCodeForm";
import { t } from "@/content/t";
import { formatZarCents } from "@/lib/money";
import { formatHostBookingDate, hostBookingStatusCopy } from "@/lib/host-booking-display";
import type { HostBookingView } from "@/server/views/booking";
import { Badge } from "@/components/ui/badge";

export function HostRequestDetails({ booking, notice, hostCompletedJobs = 0 }: { booking: HostBookingView; notice?: string; hostCompletedJobs?: number }) {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans phase-a-shell">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {booking.suburb}
            </span>
          </div>
          <Badge variant="outline" className="text-white/80 border-white/20 text-[11px] font-medium hidden sm:inline-flex">
            Fair Rotation · First Accept
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-6">
        <article
          className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6 phase-a-card host-request-card"
          aria-labelledby="host-request-title"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div>
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black mb-2 transition-colors host-request-back"
                href="/app/requests"
              >
                <ArrowLeft className="size-3.5" />
                <span>{t("host.requests.title")}</span>
              </Link>
              <h1 id="host-request-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                {booking.suburb}
              </h1>
            </div>
            <div className="self-start sm:self-center">
              <span className="host-request-status" role="status">
                <Badge variant="outline" className="text-xs font-medium px-3 py-1">
                  {t(hostBookingStatusCopy[booking.status])}
                </Badge>
              </span>
            </div>
          </div>

          {notice === "no_show_resolution_error" ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium" role="alert">
              <p>{t("host.request.no_show_resolution.error")}</p>
            </div>
          ) : null}

          {/* Details Grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs phase-a-details">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <dt className="text-neutral-500 font-semibold uppercase tracking-wider">{t("host.request.scheduled")}</dt>
              <dd className="text-neutral-900 font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5 text-neutral-400" />
                <span>
                  <time dateTime={booking.startAt}>{formatHostBookingDate(booking.startAt)}</time> –{" "}
                  <time dateTime={booking.endAt}>{formatHostBookingDate(booking.endAt)}</time>
                </span>
              </dd>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <dt className="text-neutral-500 font-semibold uppercase tracking-wider">{t("host.request.address")}</dt>
              <dd className="text-neutral-900 font-medium flex items-center gap-1.5">
                <MapPin className="size-3.5 text-neutral-400" />
                <span>{booking.address}</span>
              </dd>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <dt className="text-neutral-500 font-semibold uppercase tracking-wider">{t("host.request.pay_per_helper")}</dt>
              <dd className="text-neutral-900 font-medium flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-neutral-400" />
                <span>{formatZarCents(booking.payPerHelperCents)}</span>
              </dd>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <dt className="text-neutral-500 font-semibold uppercase tracking-wider">{t("host.request.transport")}</dt>
              <dd className="text-neutral-900 font-medium flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-neutral-400" />
                <span>{formatZarCents(booking.transportPerHelperCents)}</span>
              </dd>
            </div>

            {booking.accessNotes ? (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1 sm:col-span-2">
                <dt className="text-neutral-500 font-semibold uppercase tracking-wider">{t("host.label.notes")}</dt>
                <dd className="text-neutral-900 font-medium flex items-start gap-1.5">
                  <KeyRound className="size-3.5 text-neutral-400 mt-0.5 shrink-0" />
                  <span>{booking.accessNotes}</span>
                </dd>
              </div>
            ) : null}

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1 sm:col-span-2">
              <dt className="text-neutral-500 font-semibold uppercase tracking-wider">{t("host.request.assigned")}</dt>
              <dd className="text-neutral-900 font-medium">
                {booking.assignedHelpers.length} / {booking.helpersNeeded}
              </dd>
            </div>
          </dl>

          {/* Assigned Helpers */}
          {booking.assignedHelpers.length > 0 ? (
            <section className="space-y-3 host-request-helpers" aria-labelledby="assigned-helper-heading">
              <h2 id="assigned-helper-heading" className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
                {t("host.request.helper_phone")}
              </h2>
              <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 overflow-hidden phase-a-list">
                {booking.assignedHelpers.map((helper) => (
                  <li key={helper.helperId} className="p-4 flex items-center justify-between bg-neutral-50">
                    <div>
                      <strong className="block text-sm font-semibold text-neutral-900">{helper.firstName}</strong>
                      <span className="text-xs text-neutral-500">{helper.phone}</span>
                    </div>
                    <a
                      href={`https://wa.me/${helper.phone.replace(/\D/g, "")}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <PhoneCall className="size-3.5" />
                      <span>{t("button.message_whatsapp")}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Check-In Code Form */}
          {booking.status === "assigned" ? <CheckInCodeForm bookingId={booking.id} /> : null}

          {/* Confirm Completion */}
          {booking.status === "in_progress" ? (
            <form className="phase-a-form" action="/api/bookings/confirm" method="post">
              <input type="hidden" name="bookingId" value={booking.id} />
              <button
                className="w-full h-12 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-md phase-a-button"
                type="submit"
              >
                {t("host.finish.confirm")}
              </button>
            </form>
          ) : null}

          {/* No Show Slots */}
          {booking.status !== "completed" && booking.status !== "cancelled" && booking.noShowSlots.length ? (
            <section className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3" aria-labelledby="no-show-resolution-title">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-700" />
                <h2 id="no-show-resolution-title" className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  {t("host.request.no_show_resolution.title")}
                </h2>
              </div>
              {booking.noShowSlots.map((slot) => {
                if (!slot.noShowAt || !booking.noShowRecoveryMinutes) return null;
                if (slot.resolution === "proceed_fewer")
                  return <p key={slot.slot} role="status" className="text-xs text-neutral-700">{t("host.request.no_show_resolution.done_proceed")}</p>;
                if (slot.resolution === "close_vacant_slot")
                  return <p key={slot.slot} role="status" className="text-xs text-neutral-700">{t("host.request.no_show_resolution.done_close")}</p>;
                if (!slot.canResolve)
                  return (
                    <p key={slot.slot} className="text-xs text-neutral-700">
                      {t("host.request.no_show_resolution.waiting", { minutes: String(booking.noShowRecoveryMinutes) })}
                    </p>
                  );
                return (
                  <div key={slot.slot} className="space-y-2 pt-1">
                    <p className="text-xs text-neutral-700">
                      {t(slot.canProceedWithFewer ? "host.request.no_show_resolution.body" : "host.request.no_show_resolution.body_close_only", {
                        minutes: String(booking.noShowRecoveryMinutes),
                      })}
                    </p>
                    <form className="flex items-center gap-2 phase-a-form" action="/api/bookings/no-show-resolution" method="post">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="slot" value={slot.slot} />
                      {slot.canProceedWithFewer ? (
                        <button
                          className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors phase-a-button"
                          name="resolution"
                          value="proceed_fewer"
                          type="submit"
                        >
                          {t("host.request.no_show_resolution.proceed")}
                        </button>
                      ) : null}
                      <button
                        className="px-4 py-2 rounded-xl bg-neutral-200 text-neutral-800 text-xs font-semibold hover:bg-neutral-300 transition-colors phase-a-button"
                        name="resolution"
                        value="close_vacant_slot"
                        type="submit"
                      >
                        {t("host.request.no_show_resolution.close")}
                      </button>
                    </form>
                  </div>
                );
              })}
            </section>
          ) : null}

          {/* Post-Job Survey + Book Again (completed bookings only) */}
          {booking.status === "completed" && booking.assignedHelpers.length > 0 ? (
            <section className="space-y-4" aria-labelledby="post-job-section-title">
              <h2 id="post-job-section-title" className="text-sm font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                <Star className="size-4 text-amber-500" />
                After Your Booking
              </h2>

              {/* Private "Book Again?" survey — one per assigned helper */}
              {booking.assignedHelpers.map((helper) => (
                <div key={helper.helperId} className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <p className="text-sm font-medium text-amber-900">
                    Would you book <strong>{helper.firstName}</strong> again through SIZA?
                  </p>
                  <p className="text-xs text-amber-700">
                    This is private feedback that helps us highlight reliable helpers and improve rotation quality.
                  </p>
                  <form action="/api/host/repeat-intent" method="post" className="flex items-center gap-3">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="helperId" value={helper.helperId} />
                    <button
                      name="intent"
                      value="yes"
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      Yes, definitely
                    </button>
                    <button
                      name="intent"
                      value="no"
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-semibold transition-colors"
                    >
                      Not this time
                    </button>
                  </form>
                </div>
              ))}

              {/* Book Again — available after 3 completed bookings */}
              {hostCompletedJobs >= 3 && booking.assignedHelpers.map((helper) => (
                <div key={`book-again-${helper.helperId}`} className="p-5 rounded-2xl bg-white border border-neutral-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-neutral-900">
                      Book <strong>{helper.firstName}</strong> again
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    A new booking will be created with the same details. {helper.firstName} gets first priority — if unavailable, standard rotation takes over.
                  </p>
                  <form action="/api/host/rebook" method="post">
                    <input type="hidden" name="sourceBookingId" value={booking.id} />
                    <input type="hidden" name="helperId" value={helper.helperId} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      <RefreshCw className="size-3.5" />
                      Book Again with {helper.firstName}
                    </button>
                  </form>
                </div>
              ))}
            </section>
          ) : null}

          {/* Report Button */}
          <div className="pt-2">
            <Link
              className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:text-black hover:border-black text-xs font-semibold transition-colors phase-a-button phase-a-button-link"
              href={`/app/report?bookingId=${booking.id}`}
            >
              {t("host.request.report")}
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}

export function HostRequestLoadError({ bookingId }: { bookingId: string }) {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans phase-a-shell">
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/app" className="text-lg font-bold tracking-tighter">siZa.</Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <section className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-4 phase-a-card host-request-error" role="alert">
          <h1 className="text-xl font-bold text-neutral-900">{t("host.request.load_error.title")}</h1>
          <p className="text-sm text-neutral-600">{t("phase_a.error")}</p>
          <div>
            <Link
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors phase-a-button phase-a-button-link"
              href={`/app/requests/${bookingId}`}
            >
              {t("button.retry")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
