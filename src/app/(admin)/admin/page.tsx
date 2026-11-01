import Link from "next/link";
import { t } from "@/content/t";
import { requireAdmin } from "@/server/policies/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
          SIZA / Admin
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-8">
          Keep the marketplace moving.
        </h1>
        <div className="grid gap-3">
          <Link
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-neutral-200 hover:border-black shadow-sm transition-all group"
            href="/admin/overview"
          >
            <div>
              <span className="text-xs font-mono font-bold text-neutral-400 block mb-0.5">
                00
              </span>
              <strong className="text-sm font-semibold text-neutral-900 group-hover:underline">
                View overview
              </strong>
              <p className="text-xs text-neutral-600 mt-1">
                See pending helpers, open requests and reports.
              </p>
            </div>
            <span
              className="text-neutral-400 group-hover:text-black transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              ↗
            </span>
          </Link>
          <Link
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-neutral-200 hover:border-black shadow-sm transition-all group"
            href="/admin/helpers"
          >
            <div>
              <span className="text-xs font-mono font-bold text-neutral-400 block mb-0.5">
                01
              </span>
              <strong className="text-sm font-semibold text-neutral-900 group-hover:underline">
                Review helper applications
              </strong>
              <p className="text-xs text-neutral-600 mt-1">
                Open documents and the approval checklist together.
              </p>
            </div>
            <span
              className="text-neutral-400 group-hover:text-black transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              ↗
            </span>
          </Link>
          <Link
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-neutral-200 hover:border-black shadow-sm transition-all group"
            href="/admin/bookings"
          >
            <div>
              <span className="text-xs font-mono font-bold text-neutral-400 block mb-0.5">
                02
              </span>
              <strong className="text-sm font-semibold text-neutral-900 group-hover:underline">
                Match booking requests
              </strong>
              <p className="text-xs text-neutral-600 mt-1">
                Shortlist by suburb and service, then assign in one step.
              </p>
            </div>
            <span
              className="text-neutral-400 group-hover:text-black transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              ↗
            </span>
          </Link>
          <Link
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-neutral-200 hover:border-black shadow-sm transition-all group"
            href="/admin/reports"
          >
            <div>
              <span className="text-xs font-mono font-bold text-neutral-400 block mb-0.5">
                03
              </span>
              <strong className="text-sm font-semibold text-neutral-900 group-hover:underline">
                Review reports
              </strong>
              <p className="text-xs text-neutral-600 mt-1">
                See reports and resolve the next action.
              </p>
            </div>
            <span
              className="text-neutral-400 group-hover:text-black transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              ↗
            </span>
          </Link>
          <Link
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-neutral-200 hover:border-black shadow-sm transition-all group"
            href="/admin/audit"
          >
            <div>
              <span className="text-xs font-mono font-bold text-neutral-400 block mb-0.5">
                04
              </span>
              <strong className="text-sm font-semibold text-neutral-900 group-hover:underline">
                {t("admin.nav.audit")}
              </strong>
              <p className="text-xs text-neutral-600 mt-1">
                {t("admin.audit.home.summary")}
              </p>
            </div>
            <span
              className="text-neutral-400 group-hover:text-black transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              ↗
            </span>
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
