import { requireAdmin } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminReportsPage() {
  await requireAdmin();
  const { data: reports } = await createSupabaseAdminClient().from("phase_a_reports").select("id, booking_id, category, text, status, created_at").order("created_at", { ascending: false });
  return <AdminShell><div className="admin-main"><p className="siza-label">SIZA / reports</p><h1 className="admin-title">Reports</h1><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Category</th><th>Booking</th><th>Report</th><th>Status</th><th>Received</th></tr></thead><tbody>{(reports ?? []).map((report) => <tr key={report.id}><td>{report.category}</td><td>{report.booking_id ?? "—"}</td><td>{report.text}</td><td>{report.status}</td><td>{new Date(report.created_at).toLocaleString("en-ZA")}</td></tr>)}</tbody></table>{!reports?.length ? <p className="admin-empty">No reports yet.</p> : null}</div></div></AdminShell>;
}
