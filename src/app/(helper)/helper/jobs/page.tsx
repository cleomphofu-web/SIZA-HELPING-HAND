import { redirect } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";
import { getHelperOfferSummaries } from "@/server/views/booking-read";

export default async function HelperJobsPage() {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "helper") redirect("/");
  const result = await getHelperOfferSummaries();
  const offers = result.ok ? result.data : [];
  return <main className="phase-a-shell"><div className="phase-a-card"><p className="starter-eyebrow">SIZA / HELPER</p><h1>{t("helper.jobs.title")}</h1>{offers.length ? <ul className="phase-a-list">{offers.map((offer) => { const amount = ((Number(offer.payPerHelperCents) + Number(offer.transportPerHelperCents)) / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return <li key={`${offer.id}-${offer.slot}`}><div><strong>{offer.suburb}</strong><span>{t("helper.jobs.you_receive", { amount })}</span></div><form action="/api/helper/jobs/accept" method="post"><input type="hidden" name="bookingId" value={offer.id} /><input type="hidden" name="slot" value={offer.slot} /><button className="phase-a-button" type="submit">{t("helper.jobs.accept")}</button></form></li>; })}</ul> : <p className="starter-copy">{t("phase_a.empty_jobs")}</p>}</div></main>;
}
