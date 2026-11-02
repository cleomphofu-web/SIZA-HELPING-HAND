import { notFound, redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";
import { getBookingView, getHostBookingSummaries } from "@/server/views/booking-read";
import { HostRequestDetails, HostRequestLoadError } from "@/components/HostRequestDetails";

export default async function HostRequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "host") redirect("/");
  const { id } = await params;
  const { notice } = await searchParams;
  const [result, summariesResult] = await Promise.all([
    getBookingView(id),
    getHostBookingSummaries(),
  ]);
  if (!result.ok) {
    if (result.error.code === "not_found") notFound();
    if (result.error.code === "unauthenticated") redirect("/login");
    return <HostRequestLoadError bookingId={id} />;
  }
  if (result.data.audience !== "host") notFound();
  const completedJobs = summariesResult.ok
    ? summariesResult.data.filter((b) => b.status === "completed").length
    : 0;
  return <HostRequestDetails booking={result.data} notice={notice} hostCompletedJobs={completedJobs} />;
}
