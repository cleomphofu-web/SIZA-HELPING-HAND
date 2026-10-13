import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getShortlist } from "@/app/admin/bookings/actions";
import { AdminShell } from "@/components/AdminShell";
import { AssignmentControls } from "./AssignmentControls";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: booking } = await supabase.from("bookings").select("id, suburb, address, property_type, cleaners_needed, start_at, end_at, access_notes, notes, status, assigned_cleaner_ids").eq("id", id).single();
  if (!booking) notFound();
  const shortlist = await getShortlist(id);
  const summary = `SIZA booking\nSuburb: ${booking.suburb}\nProperty: ${booking.property_type}\nStart: ${new Date(booking.start_at).toLocaleString("en-ZA")}\nCleaners needed: ${booking.cleaners_needed}`;

  return (
    <AdminShell>
      <div className="admin-main">
        <Link className="siza-link" href="/admin/bookings">Back to bookings <span aria-hidden="true">↗</span></Link>
        <p className="siza-label mt-12">Booking / {booking.status}</p>
        <h1 className="admin-title">{booking.suburb}</h1>
        <div className="admin-detail-grid">
          <section>
            <dl className="admin-definition-list">
              <div><dt>Property</dt><dd>{booking.property_type}<br />{booking.address}</dd></div>
              <div><dt>When</dt><dd>{new Date(booking.start_at).toLocaleString("en-ZA")}<br />to {new Date(booking.end_at).toLocaleTimeString("en-ZA")}</dd></div>
              <div><dt>Cleaners</dt><dd>{booking.cleaners_needed}</dd></div>
              <div><dt>Access</dt><dd>{booking.access_notes || "None provided"}</dd></div>
              <div><dt>Notes</dt><dd>{booking.notes || "None provided"}</dd></div>
            </dl>
          </section>
          <aside>
            <div className="admin-panel"><p className="admin-panel-title">Approved cleaners for this request</p><AssignmentControls bookingId={id} summary={summary} cleaners={shortlist ?? []} /></div>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

