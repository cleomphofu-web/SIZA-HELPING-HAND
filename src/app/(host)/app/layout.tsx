import { redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";

export default async function HostAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "host") redirect("/");
  return <>{children}</>;
}
