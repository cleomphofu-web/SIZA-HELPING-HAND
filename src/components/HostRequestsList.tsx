import Link from "next/link";
import { Clock, Calendar, MapPin, ChevronRight, AlertCircle, ArrowRight } from "lucide-react";
import { t } from "@/content/t";
import { formatHostBookingDate, hostBookingStatusCopy } from "@/lib/host-booking-display";
import type { HostBookingSummary } from "@/server/views/booking-read";
import { Badge } from "@/components/ui/badge";

export function HostRequestsList({ requests, loadFailed }: { requests: HostBookingSummary[]; loadFailed: boolean }) {
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
              {t("host.requests.title")}
            </span>
          </div>
          <Badge variant="outline" className="text-white/80 border-white/20 text-[11px] font-medium hidden sm:inline-flex">
            Fair Rotation · First Accept
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-6">
        <section
          className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6 host-activity-card"
          aria-labelledby="host-activity-title"
        >
          <div className="border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="size-4 text-neutral-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Job History &amp; Active Requests
              </span>
            </div>
            <h1 id="host-activity-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              {t("host.requests.title")}
            </h1>
            <p className="text-sm text-neutral-600 mt-1 starter-copy">
              {t("host.requests.body")}
            </p>
          </div>

          {loadFailed ? (
            <div
              className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3 host-activity-state"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-red-600 shrink-0" />
                <p className="text-sm font-medium">{t("phase_a.error")}</p>
              </div>
              <div>
                <Link
                  href="/app/requests"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-red-900 text-white text-xs font-semibold hover:bg-red-800 transition-colors"
                >
                  {t("button.retry")}
                </Link>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center space-y-4 host-activity-state">
              <p className="text-sm text-neutral-600 max-w-sm mx-auto">
                {t("phase_a.empty_requests")}
              </p>
              <div>
                <Link
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm phase-a-button-link phase-a-button"
                  href="/app/book"
                >
                  <span>{t("button.request")}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 host-activity-list">
              {requests.map((request) => (
                <li key={request.id}>
                  <Link
                    className="flex items-center justify-between py-4 px-3 -mx-3 rounded-xl hover:bg-neutral-50 transition-colors group host-activity-row"
                    href={`/app/requests/${request.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-neutral-400" />
                        <strong className="text-sm font-semibold text-neutral-900 group-hover:text-black">
                          {request.suburb}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Calendar className="size-3" />
                        <time dateTime={request.startAt}>{formatHostBookingDate(request.startAt)}</time>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="host-activity-status">
                        <Badge variant="outline" className="text-xs font-medium">
                          {t(hostBookingStatusCopy[request.status])}
                        </Badge>
                      </span>
                      <span className="text-xs font-semibold text-neutral-500 group-hover:text-black hidden sm:inline host-activity-open">
                        {t("host.requests.view")}
                      </span>
                      <ChevronRight className="size-4 text-neutral-400 group-hover:text-black transition-colors" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
