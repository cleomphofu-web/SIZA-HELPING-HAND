import { redirect } from "next/navigation";
import { requireActor } from "@/server/policies/auth";

export default async function HelperLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "helper") redirect("/");
  return <>{children}</>;
}
