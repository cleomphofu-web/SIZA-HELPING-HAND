import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/policies/auth";
import { getBookingView } from "@/server/views/booking-read";
import { getShortlist } from "@/app/(admin)/admin/bookings/actions";
import { AdminShell } from "@/components/AdminShell";
import { AssignmentControls } from "./HelperAssignmentControls";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const result = await getBookingView(id);
  if (!result.ok || result.data.audience !== "admin") notFound();
  const booking = result.data;
  const shortlist = await getShortlist(id);
  if (!shortlist.ok) notFound();
  return <AdminShell><div className="admin-main"><Link className="siza-link" href="/admin/bookings">Back to bookings</Link><p className="siza-label mt-12">Booking / {booking.status}</p><h1 className="admin-title">{booking.suburb}</h1><div className="admin-detail-grid"><section><dl className="admin-definition-list"><div><dt>Services</dt><dd>{booking.services.join(", ")}</dd></div><div><dt>Address</dt><dd>{booking.address}</dd></div><div><dt>When</dt><dd>{new Date(booking.startAt).toLocaleString("en-ZA")} to {new Date(booking.endAt).toLocaleTimeString("en-ZA")}</dd></div><div><dt>Helpers</dt><dd>{booking.helpersNeeded}</dd></div><div><dt>Access</dt><dd>{booking.accessNotes || "None provided"}</dd></div></dl></section><aside><div className="admin-panel"><p className="admin-panel-title">Approved helpers for this request</p><AssignmentControls bookingId={id} helpers={shortlist.data.candidates} version={shortlist.data.version} /></div></aside></div></div></AdminShell>;
}
