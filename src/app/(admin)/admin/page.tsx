import Link from "next/link";
import { t } from "@/content/t";
import { requireAdmin } from "@/server/policies/auth";
import { AdminShell } from "@/components/AdminShell";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  Calendar,
  AlertCircle,
  FileCheck,
  Shield,
  ArrowUpRight,
} from "lucide-react";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            siZa / Admin
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Keep the marketplace moving.
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Macro operational queues, verification checkpoints, and dispute management.
          </p>
        </div>

        <BentoGrid>
          {/* Card 0: Live Overview Hero Card (Spans 2 cols) */}
          <BentoCard dark className="md:col-span-2 space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono font-bold text-neutral-400">00</span>
              <span className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Marketplace Analytics
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                View Overview &amp; Health
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
                Live aggregate counts for hosts, active helper pools across JHB/Vaal, open booking requests, and pending safety reports.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/admin/overview"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-sm"
              >
                <span>Open Overview Dashboard</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </BentoCard>

          {/* Card 1: Review Helper Applications */}
          <BentoCard className="space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono font-bold text-neutral-400">01</span>
              <div className="size-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                <FileCheck className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Helper Applications
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Review ID documents, profile details, and approve vetted helpers into fair rotation.
              </p>
            </div>
            <Link
              href="/admin/helpers"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:underline pt-2"
            >
              <span>Review Applications</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </BentoCard>

          {/* Card 2: Match Booking Requests */}
          <BentoCard className="space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono font-bold text-neutral-400">02</span>
              <div className="size-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                <Calendar className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Booking Management
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Monitor fair rotation offers, manage slot vacancies, and resolve no-show slots.
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:underline pt-2"
            >
              <span>Monitor Bookings</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </BentoCard>

          {/* Card 3: Review Reports */}
          <BentoCard className="space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono font-bold text-neutral-400">03</span>
              <div className="size-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Reports &amp; Disputes
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Handle host and helper support submissions, payment notes, and resolve incidents.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline pt-2"
            >
              <span>View Open Reports</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </BentoCard>

          {/* Card 4: Audit Log */}
          <BentoCard className="space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono font-bold text-neutral-400">04</span>
              <div className="size-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                <Shield className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                {t("admin.nav.audit")}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {t("admin.audit.home.summary")}
              </p>
            </div>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:underline pt-2"
            >
              <span>Inspect Audit Trail</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </BentoCard>
        </BentoGrid>
      </div>
    </AdminShell>
  );
}
