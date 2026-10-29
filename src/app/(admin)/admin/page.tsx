import Link from "next/link";
import { t } from "@/content/t";
import { requireAdmin } from "@/server/policies/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">SIZA / admin</p>
        <h1 className="admin-title">Keep the marketplace moving.</h1>
        <div className="siza-row-list mt-16">
          <Link className="siza-row" href="/admin/overview"><span className="siza-row-number">00</span><span className="siza-row-title">View overview</span><span className="siza-row-copy">See pending helpers, open requests and reports.</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
          <Link className="siza-row" href="/admin/helpers"><span className="siza-row-number">01</span><span className="siza-row-title">Review helper applications</span><span className="siza-row-copy">Open documents and the approval checklist together.</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
          <Link className="siza-row" href="/admin/bookings"><span className="siza-row-number">02</span><span className="siza-row-title">Match booking requests</span><span className="siza-row-copy">Shortlist by suburb and service, then assign in one step.</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
          <Link className="siza-row" href="/admin/reports"><span className="siza-row-number">03</span><span className="siza-row-title">Review reports</span><span className="siza-row-copy">See reports and resolve the next action.</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
          <Link className="siza-row" href="/admin/audit"><span className="siza-row-number">04</span><span className="siza-row-title">{t("admin.nav.audit")}</span><span className="siza-row-copy">{t("admin.audit.home.summary")}</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </AdminShell>
  );
}
