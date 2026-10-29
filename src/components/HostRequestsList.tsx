import Link from "next/link";
import { t } from "@/content/t";
import { formatHostBookingDate, hostBookingStatusCopy } from "@/lib/host-booking-display";
import type { HostBookingSummary } from "@/server/views/booking-read";

export function HostRequestsList({ requests, loadFailed }: { requests: HostBookingSummary[]; loadFailed: boolean }) {
  return (
    <main className="phase-a-shell">
      <section className="host-activity-card" aria-labelledby="host-activity-title">
        <h1 id="host-activity-title">{t("host.requests.title")}</h1>
        <p className="starter-copy">{t("host.requests.body")}</p>

        {loadFailed ? (
          <div className="host-activity-state" role="alert">
            <p>{t("phase_a.error")}</p>
            <Link href="/app/requests">{t("button.retry")}</Link>
          </div>
        ) : requests.length === 0 ? (
          <div className="host-activity-state">
            <p>{t("phase_a.empty_requests")}</p>
            <Link className="phase-a-button-link phase-a-button" href="/app/book">{t("button.request")}</Link>
          </div>
        ) : (
          <ul className="host-activity-list">
            {requests.map((request) => (
              <li key={request.id}>
                <Link className="host-activity-row" href={`/app/requests/${request.id}`}>
                  <strong>{request.suburb}</strong>
                  <time dateTime={request.startAt}>{formatHostBookingDate(request.startAt)}</time>
                  <span className="host-activity-status">{t(hostBookingStatusCopy[request.status])}</span>
                  <span className="host-activity-open">{t("host.requests.view")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
