import { redirect, notFound } from "next/navigation";
import { t } from "@/content/t";
import { requireActor } from "@/server/policies/auth";
import { getBookingView } from "@/server/views/booking-read";
import Link from "next/link";

export default async function HelperJobPage({ params }: { params: Promise<{ id: string }> }) {
  let actor;
  try { actor = await requireActor(); } catch { redirect("/login"); }
  if (actor.role !== "helper") redirect("/");
  const { id } = await params;
  const result = await getBookingView(id);
  if (!result.ok || result.data.audience !== "helper" || !result.data.address) notFound();
  const booking = result.data;
  return <main className="phase-a-shell"><div className="phase-a-card"><p className="starter-eyebrow">SIZA / HELPER</p><h1>{booking.suburb}</h1><p className="starter-copy">{booking.address}</p>{!booking.checkedInAt ? <form className="phase-a-form" action="/api/helper/jobs/check-in" method="post"><input type="hidden" name="bookingId" value={booking.id} /><label>{t("phase_a.check_in.title")}<input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} /></label><button className="phase-a-button" type="submit">{t("helper.mine.checkin")}</button></form> : <><form className="phase-a-form" action="/api/bookings/confirm" method="post"><input type="hidden" name="bookingId" value={booking.id} /><button className="phase-a-button" type="submit">{t("helper.mine.finish")}</button></form><Link className="phase-a-button phase-a-button-link" href={`/helper/report?bookingId=${booking.id}`}>{t("host.request.report")}</Link></>}</div></main>;
}
