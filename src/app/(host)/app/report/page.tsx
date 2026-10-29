import Link from "next/link";
import { randomUUID } from "node:crypto";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { t } from "@/content/t";
import { Badge } from "@/components/ui/badge";

export default async function HostReportPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans phase-a-shell">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {t("phase_a.report.title")}
            </span>
          </div>
          <Badge variant="outline" className="text-white/80 border-white/20 text-[11px] font-medium hidden sm:inline-flex">
            Support &amp; Safety
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-6">
        <div
          className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6 phase-a-card"
        >
          <div className="border-b border-neutral-100 pb-4">
            <Link
              href={params.bookingId ? `/app/requests/${params.bookingId}` : "/app/requests"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black mb-2 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back</span>
            </Link>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1 starter-eyebrow">
              SIZA / HOST
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              {t("phase_a.report.title")}
            </h1>
            <p className="text-sm text-neutral-600 mt-1 starter-copy">
              {t("phase_a.report.body")}
            </p>
          </div>

          {params.bookingId ? (
            <form className="space-y-4 phase-a-form" action="/api/reports" method="post">
              <input type="hidden" name="idempotencyKey" value={randomUUID()} />
              <input type="hidden" name="bookingId" value={params.bookingId} />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("phase_a.report.category")}
                </label>
                <select
                  name="category"
                  defaultValue="other"
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="no_show">{t("phase_a.report.no_show")}</option>
                  <option value="safety">{t("phase_a.report.safety")}</option>
                  <option value="payment">{t("phase_a.report.payment")}</option>
                  <option value="conduct">{t("phase_a.report.conduct")}</option>
                  <option value="other">{t("phase_a.report.other")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("phase_a.report.what_happened")}
                </label>
                <textarea
                  name="text"
                  required
                  maxLength={3000}
                  rows={6}
                  placeholder="Please provide details about what happened..."
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2">
                <button
                  className="h-11 px-6 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer phase-a-button"
                  type="submit"
                >
                  {t("button.submit")}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center">
              <p className="text-sm text-neutral-600 starter-copy">
                {t("phase_a.report.booking_required")}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
