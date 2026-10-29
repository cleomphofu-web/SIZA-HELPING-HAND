import Link from "next/link";
import { t } from "@/content/t";
import { formatHostBookingDate, hostBookingStatusCopy } from "@/lib/host-booking-display";
import type { HostBookingSummary } from "@/server/views/booking-read";

type Props = {
  requests: HostBookingSummary[];
  loadFailed: boolean;
};

export function HostHomeDashboard({ requests, loadFailed }: Props) {
  return (
    <main className="phase-a-shell">
      <div className="host-home-card">
        <p className="starter-eyebrow">SIZA / HOST</p>
        <h1>{t("host.preview.title")}</h1>
        <p className="starter-copy">{t("host.app.body")}</p>

        <div className="host-home-actions">
          <Link className="phase-a-button-link phase-a-button" href="/app/book">{t("button.request")}</Link>
          <Link className="host-home-profile" href="/app/profile">{t("host.profile.title")}</Link>
        </div>

        <section className="host-home-requests" aria-labelledby="host-home-requests-title">
          <div className="host-home-section-heading">
            <h2 id="host-home-requests-title">{t("host.home.recent_requests")}</h2>
            {requests.length > 0 && <Link href="/app/requests">{t("host.home.view_requests")}</Link>}
          </div>

          {loadFailed ? (
            <div className="host-home-empty" role="alert">
              <p>{t("phase_a.error")}</p>
              <a href="/app">{t("button.retry")}</a>
            </div>
          ) : requests.length === 0 ? (
            <div className="host-home-empty">
              <p>{t("host.home.empty_requests")}</p>
              <Link href="/app/book">{t("button.request")}</Link>
            </div>
          ) : (
            <ul className="host-home-request-list">
              {requests.slice(0, 3).map((request) => (
                <li key={request.id}>
                  <Link href={`/app/requests/${request.id}`}>
                    <span className="host-home-request-main">
                      <strong>{request.suburb}</strong>
                      <time dateTime={request.startAt}>{formatHostBookingDate(request.startAt)}</time>
                    </span>
                    <span className="host-home-request-status">{t(hostBookingStatusCopy[request.status])}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
