import { notFound, redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";
import { getBookingView } from "@/server/views/booking-read";
import { HostRequestDetails, HostRequestLoadError } from "@/components/HostRequestDetails";

export default async function HostRequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "host") redirect("/");
  const { id } = await params;
  const { notice } = await searchParams;
  const result = await getBookingView(id);
  if (!result.ok) {
    if (result.error.code === "not_found") notFound();
    if (result.error.code === "unauthenticated") redirect("/login");
    return <HostRequestLoadError bookingId={id} />;
  }
  if (result.data.audience !== "host") notFound();
  return <HostRequestDetails booking={result.data} notice={notice} />;
}
