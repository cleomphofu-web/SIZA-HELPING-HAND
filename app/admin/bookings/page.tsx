import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isUnassignedUrgent } from "@/lib/booking-utils";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: bookings } = await supabase.from("bookings").select("id, suburb, property_type, start_at, status, assigned_cleaner_ids").order("start_at", { ascending: true });

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
                const urgent = isUnassignedUrgent(booking);
                return <tr key={booking.id}>
                  <td><Link href={`/admin/bookings/${booking.id}`}>{booking.suburb}</Link></td>
                  <td>{booking.property_type}</td>
                  <td className="mono">{new Date(booking.start_at).toLocaleString("en-ZA")}</td>
                  <td><span className="admin-status">{booking.status}</span></td>
                  <td>{urgent ? <span className="admin-status admin-status-urgent">Urgent / unassigned</span> : ""}</td>
                </tr>;
              })}
            </tbody>
          </table>
          {!bookings?.length ? <p className="admin-empty">No booking requests yet.</p> : null}
        </div>
      </div>
    </AdminShell>
  );
}

