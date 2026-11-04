import Link from "next/link";
import { t } from "@/content/t";
import type { CopyKey } from "@/content/copy.generated";
import { AdminShell } from "@/components/AdminShell";
import { getAdminOverview } from "@/server/views/admin-overview";

export default async function AdminOverviewPage() {
  const result = await getAdminOverview();
  if (!result.ok) {
    return <AdminShell><div className="admin-main admin-overview-state" role="alert">
      <h1 className="admin-title">{t("admin.overview.error.title")}</h1>
      <p>{t("admin.overview.error.body")}</p>
      <Link href="/admin/overview">{t("admin.overview.retry")}</Link>
    </div></AdminShell>;
  }

  const metrics: Array<{ key: CopyKey; value: number; href?: "/admin/helpers" | "/admin/bookings" | "/admin/reports" }> = [
    { key: "admin.overview.metric.hosts", value: result.data.hosts },
    { key: "admin.overview.metric.helpers_pending", value: result.data.helpers.pending, href: "/admin/helpers" },
    { key: "admin.overview.metric.helpers_approved", value: result.data.helpers.approved, href: "/admin/helpers" },
    { key: "admin.overview.metric.helpers_declined", value: result.data.helpers.declined, href: "/admin/helpers" },
    { key: "admin.overview.metric.helpers_suspended", value: result.data.helpers.suspended, href: "/admin/helpers" },
    { key: "admin.overview.metric.requests_open", value: result.data.bookings.open, href: "/admin/bookings" },
    { key: "admin.overview.metric.requests_assigned", value: result.data.bookings.assigned, href: "/admin/bookings" },
    { key: "admin.overview.metric.jobs_in_progress", value: result.data.bookings.inProgress, href: "/admin/bookings" },
    { key: "admin.overview.metric.jobs_completed", value: result.data.bookings.completed, href: "/admin/bookings" },
    { key: "admin.overview.metric.reports_open", value: result.data.reportsToReview, href: "/admin/reports" },
  ];

  return <AdminShell><div className="admin-main">
    <p className="siza-label">{t("admin.overview.eyebrow")}</p>
    <h1 className="admin-title">{t("admin.overview.title")}</h1>
    <p className="admin-overview-intro">{t("admin.overview.intro")}</p>
    <section className="phase-a-metrics admin-overview-metrics" aria-label={t("admin.overview.title")}>
      {metrics.map(({ key, value, href }) => {
        const content = <><strong>{value.toLocaleString("en-ZA")}</strong><span>{t(key)}</span></>;
        return href
          ? <Link className="admin-overview-metric" href={href} key={key}>{content}</Link>
          : <div className="admin-overview-metric" key={key}>{content}</div>;
      })}
    </section>
    <section className="admin-overview-queues" aria-labelledby="admin-overview-queues">
      <h2 id="admin-overview-queues">{t("admin.overview.queues")}</h2>
      <div className="siza-row-list">
        <Link className="siza-row" href="/admin/helpers"><span className="siza-row-title">{t("admin.overview.queue.helpers")}</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
        <Link className="siza-row" href="/admin/bookings"><span className="siza-row-title">{t("admin.overview.queue.bookings")}</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
        <Link className="siza-row" href="/admin/reports"><span className="siza-row-title">{t("admin.overview.queue.reports")}</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
        <Link className="siza-row" href="/admin/payments"><span className="siza-row-title">{t("admin.overview.queue.payments")}</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
        <Link className="siza-row" href="/admin/ledger"><span className="siza-row-title">{t("admin.overview.queue.ledger")}</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
        <Link className="siza-row" href="/admin/settings"><span className="siza-row-title">{t("admin.overview.queue.settings")}</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
      </div>
    </section>
  </div></AdminShell>;
}
