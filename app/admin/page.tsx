import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">SIZA / admin</p>
        <h1 className="admin-title">Keep the marketplace moving.</h1>
        <div className="siza-row-list mt-16">
          <Link className="siza-row" href="/admin/cleaners"><span className="siza-row-number">01</span><span className="siza-row-title">Review cleaner applications</span><span className="siza-row-copy">Open documents and the approval checklist together.</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
          <Link className="siza-row" href="/admin/bookings"><span className="siza-row-number">02</span><span className="siza-row-title">Match booking requests</span><span className="siza-row-copy">Shortlist by suburb and service, then assign in one step.</span><span className="siza-row-arrow" aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </AdminShell>
  );
}
