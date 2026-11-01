import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Briefcase, CheckCircle2, ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { requireActor } from "@/server/policies/auth";
import { getHelperOfferSummaries } from "@/server/views/booking-read";

export const metadata = { title: "Available Jobs — siZa." };

export default async function HelperJobsPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const result = await getHelperOfferSummaries();
  const offers = result.ok ? result.data : [];

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/helper"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Jobs
            </span>
          </div>
          <Link
            href="/helper"
            className="text-xs font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* Title Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Briefcase className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  Available Job Offers
                </h1>
                <p className="text-xs text-neutral-500">
                  Jobs offered to helpers in your suburbs via fair rotation
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 font-mono">
              {offers.length} {offers.length === 1 ? "Offer" : "Offers"}
            </span>
          </div>
        </div>

        {/* Jobs Table Section */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden">
          {offers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <th scope="col" className="px-6 py-4">Area / Suburb</th>
                    <th scope="col" className="px-6 py-4">Slot</th>
                    <th scope="col" className="px-6 py-4">Total Payout</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {offers.map((offer) => {
                    const totalCents =
                      BigInt(offer.payPerHelperCents) +
                      BigInt(offer.transportPerHelperCents);
                    const amount = (Number(totalCents) / 100).toLocaleString(
                      "en-ZA",
                      {
                        style: "currency",
                        currency: "ZAR",
                      }
                    );

                    return (
                      <tr
                        key={`${offer.id}-${offer.slot}`}
                        className="hover:bg-neutral-50/70 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-neutral-900">
                              {offer.suburb}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 font-mono text-xs">
                          Slot #{offer.slot}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-neutral-900">
                            {amount}
                          </span>
                          <span className="block text-[11px] text-neutral-400">
                            Wage & transport
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="size-3" />
                            Available
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form
                            action="/api/helper/jobs/accept"
                            method="post"
                            className="inline-block"
                          >
                            <input
                              type="hidden"
                              name="bookingId"
                              value={offer.id}
                            />
                            <input
                              type="hidden"
                              name="slot"
                              value={offer.slot}
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                            >
                              <span>Approve & Accept</span>
                              <ArrowRight className="size-3.5" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <Clock className="size-10 text-neutral-400 mx-auto" />
              <h2 className="text-base font-bold text-neutral-900">
                No Available Jobs at this Moment
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                As soon as a host books cleaning services in your selected suburbs, offers are dispatched fairly and will appear in this table.
              </p>
            </div>
          )}
        </div>

        {/* Guide Notice */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-start gap-3">
          <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-900">
              Fair Rotation Policy
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              When you click &ldquo;Approve & Accept&rdquo;, the job is immediately assigned to you, and the host&apos;s full address and arrival details will be revealed on your job confirmation page.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
