import Link from "next/link";
import { CheckInCodeForm } from "@/components/CheckInCodeForm";
import { t } from "@/content/t";
import { formatZarCents } from "@/lib/money";
import { formatHostBookingDate, hostBookingStatusCopy } from "@/lib/host-booking-display";
import type { HostBookingView } from "@/server/views/booking";

export function HostRequestDetails({ booking, notice }: { booking: HostBookingView; notice?: string }) {
  return (
    <main className="phase-a-shell">
      <article className="phase-a-card host-request-card" aria-labelledby="host-request-title">
        <Link className="host-request-back" href="/app/requests">{t("host.requests.title")}</Link>
        <h1 id="host-request-title">{booking.suburb}</h1>
        <p className="host-request-status" role="status">{t(hostBookingStatusCopy[booking.status])}</p>
        {notice === "no_show_resolution_error" ? <p role="alert">{t("host.request.no_show_resolution.error")}</p> : null}

        <dl className="phase-a-details">
          <div>
            <dt>{t("host.request.scheduled")}</dt>
            <dd><time dateTime={booking.startAt}>{formatHostBookingDate(booking.startAt)}</time> – <time dateTime={booking.endAt}>{formatHostBookingDate(booking.endAt)}</time></dd>
          </div>
          <div><dt>{t("host.request.pay_per_helper")}</dt><dd>{formatZarCents(booking.payPerHelperCents)}</dd></div>
          <div><dt>{t("host.request.transport")}</dt><dd>{formatZarCents(booking.transportPerHelperCents)}</dd></div>
          <div><dt>{t("host.request.address")}</dt><dd>{booking.address}</dd></div>
          {booking.accessNotes ? <div><dt>{t("host.label.notes")}</dt><dd>{booking.accessNotes}</dd></div> : null}
          <div><dt>{t("host.request.assigned")}</dt><dd>{booking.assignedHelpers.length} / {booking.helpersNeeded}</dd></div>
        </dl>

        {booking.assignedHelpers.length > 0 ? (
          <section className="host-request-helpers" aria-labelledby="assigned-helper-heading">
            <h2 id="assigned-helper-heading">{t("host.request.helper_phone")}</h2>
            <ul className="phase-a-list">
              {booking.assignedHelpers.map((helper) => (
                <li key={helper.helperId}>
                  <div><strong>{helper.firstName}</strong><span>{helper.phone}</span></div>
                  <a href={`https://wa.me/${helper.phone.replace(/\D/g, "")}`}>{t("button.message_whatsapp")}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {booking.status === "assigned" ? <CheckInCodeForm bookingId={booking.id} /> : null}
        {booking.status === "in_progress" ? (
          <form className="phase-a-form" action="/api/bookings/confirm" method="post">
            <input type="hidden" name="bookingId" value={booking.id} />
            <button className="phase-a-button" type="submit">{t("host.finish.confirm")}</button>
          </form>
        ) : null}
        {booking.status !== "completed" && booking.status !== "cancelled" && booking.noShowSlots.length ? (
          <section aria-labelledby="no-show-resolution-title">
            <h2 id="no-show-resolution-title">{t("host.request.no_show_resolution.title")}</h2>
            {booking.noShowSlots.map((slot) => {
              if (!slot.noShowAt || !booking.noShowRecoveryMinutes) return null;
              if (slot.resolution === "proceed_fewer") return <p key={slot.slot} role="status">{t("host.request.no_show_resolution.done_proceed")}</p>;
              if (slot.resolution === "close_vacant_slot") return <p key={slot.slot} role="status">{t("host.request.no_show_resolution.done_close")}</p>;
              if (!slot.canResolve) return <p key={slot.slot}>{t("host.request.no_show_resolution.waiting", { minutes: String(booking.noShowRecoveryMinutes) })}</p>;
              return (
                <div key={slot.slot}>
                  <p>{t(slot.canProceedWithFewer ? "host.request.no_show_resolution.body" : "host.request.no_show_resolution.body_close_only", { minutes: String(booking.noShowRecoveryMinutes) })}</p>
                  <form className="phase-a-form" action="/api/bookings/no-show-resolution" method="post">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="slot" value={slot.slot} />
                    {slot.canProceedWithFewer ? <button className="phase-a-button" name="resolution" value="proceed_fewer" type="submit">{t("host.request.no_show_resolution.proceed")}</button> : null}
                    <button className="phase-a-button" name="resolution" value="close_vacant_slot" type="submit">{t("host.request.no_show_resolution.close")}</button>
                  </form>
                </div>
              );
            })}
          </section>
        ) : null}
        <Link className="phase-a-button phase-a-button-link" href={`/app/report?bookingId=${booking.id}`}>{t("host.request.report")}</Link>
      </article>
    </main>
  );
}

export function HostRequestLoadError({ bookingId }: { bookingId: string }) {
  return (
    <main className="phase-a-shell">
      <section className="phase-a-card host-request-error" role="alert">
        <h1>{t("host.request.load_error.title")}</h1>
        <p className="starter-copy">{t("phase_a.error")}</p>
        <Link className="phase-a-button phase-a-button-link" href={`/app/requests/${bookingId}`}>{t("button.retry")}</Link>
      </section>
    </main>
  );
}
