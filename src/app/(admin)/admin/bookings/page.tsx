import Link from "next/link";
import { requireAdmin } from "@/server/policies/auth";
import { getAdminBookingSummaries } from "@/server/views/booking-read";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const result = await getAdminBookingSummaries();
  const bookings = result.ok ? result.data : [];

  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">Admin / bookings</p>
        <h1 className="admin-title">Match the work.</h1>
        <p className="siza-body mt-8">Unassigned requests close to their start time are flagged here first.</p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Suburb</th><th>Property</th><th>Start</th><th>Status</th><th>Flag</th></tr></thead>
            <tbody>
              {(bookings ?? []).map((booking) => {
                return <tr key={booking.id}>
                  <td><Link href={`/admin/bookings/${booking.id}`}>{booking.suburb}</Link></td>
                  <td>{booking.services.join(", ")}</td>
                  <td className="mono">{new Date(booking.startAt).toLocaleString("en-ZA")}</td>
                  <td><span className="admin-status">{booking.status}</span></td>
                  <td>{booking.status === "open" ? <span className="admin-status admin-status-urgent">Needs offers</span> : ""}</td>
                </tr>;
              })}
            </tbody>
          </table>
          {!bookings.length ? <p className="admin-empty">No booking requests yet.</p> : null}
        </div>
      </div>
    </AdminShell>
  );
}

