import { redirect } from "next/navigation";
import { HostRequestsList } from "@/components/HostRequestsList";
import { requireActor } from "@/server/policies/auth";
import { getHostBookingSummaries } from "@/server/views/booking-read";

export default async function HostRequestsPage() {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "host") redirect("/");
  const result = await getHostBookingSummaries();
  return <HostRequestsList requests={result.ok ? result.data : []} loadFailed={!result.ok} />;
}
