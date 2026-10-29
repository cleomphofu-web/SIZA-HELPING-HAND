import { redirect } from "next/navigation";
import { HostHomeDashboard } from "@/components/HostHomeDashboard";
import { requireActor } from "@/server/policies/auth";
import { getHostBookingSummaries } from "@/server/views/booking-read";
import type { HostBookingSummary } from "@/server/views/booking-read";

export default async function HostAppPage() {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "host") redirect("/");
  let requests: HostBookingSummary[] = [];
  let loadFailed = false;
  try {
    const result = await getHostBookingSummaries();
    if (result.ok) requests = result.data;
    else loadFailed = true;
  } catch {
    loadFailed = true;
  }
  return <HostHomeDashboard requests={requests} loadFailed={loadFailed} />;
}
