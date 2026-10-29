import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";

export default async function HelperAppPage() {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "helper") redirect("/");
  return <main className="phase-a-shell"><div className="phase-a-card"><p className="starter-eyebrow">SIZA / HELPER</p><h1>{t("helper.app.title")}</h1><p className="starter-copy">{t("helper.app.body")}</p><div className="phase-a-list"><Link className="phase-a-button-link phase-a-button" href="/helper/onboarding">{t("button.save")}</Link><Link className="phase-a-button-link phase-a-button" href="/helper/jobs">{t("helper.jobs.title")}</Link><Link className="phase-a-button-link phase-a-button" href="/helper/profile">{t("helper.matching.title")}</Link></div></div></main>;
}
