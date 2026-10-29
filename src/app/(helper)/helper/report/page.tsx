import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";

export default async function HelperReportPage({ searchParams }: { searchParams: Promise<{ bookingId?: string }> }) {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "helper") redirect("/");
  const params = await searchParams;
  return <main className="phase-a-shell"><div className="phase-a-card"><p className="starter-eyebrow">SIZA / HELPER</p><h1>{t("phase_a.report.title")}</h1><p className="starter-copy">{t("phase_a.report.body")}</p>{params.bookingId ? <form className="phase-a-form" action="/api/reports" method="post"><input type="hidden" name="idempotencyKey" value={randomUUID()} /><input type="hidden" name="bookingId" value={params.bookingId} /><label>{t("phase_a.report.category")}<select name="category" defaultValue="other"><option value="no_show">{t("phase_a.report.no_show")}</option><option value="safety">{t("phase_a.report.safety")}</option><option value="payment">{t("phase_a.report.payment")}</option><option value="conduct">{t("phase_a.report.conduct")}</option><option value="other">{t("phase_a.report.other")}</option></select></label><label>{t("phase_a.report.what_happened")}<textarea name="text" required maxLength={3000} rows={6} /></label><button className="phase-a-button" type="submit">{t("button.submit")}</button></form> : <p className="starter-copy">{t("phase_a.report.booking_required")}</p>}</div></main>;
}
