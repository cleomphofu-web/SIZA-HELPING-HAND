import Link from "next/link";
import { redirect } from "next/navigation";
import {
  User,
  LogOut,
  HelpCircle,
  ShieldCheck,
  FileText,
  KeyRound,
  Trash2,
  ChevronRight,
  BookOpen,
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { createSupabaseServerClient } from "@/server/db/server";

export const metadata = { title: "Settings & Account — siZa." };

export default async function HelperAccountPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  if (actor.role !== "helper") redirect("/");

  const supabase = createSupabaseAdminClient();
  const serverSupabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, phone").eq("id", actor.userId).maybeSingle(),
    serverSupabase.auth.getUser(),
  ]);

  const guides = [
    {
      title: "How Check-In Codes Work",
      description: "When you arrive at the booking address, the host has a 4-digit check-in code on their screen. Ask them for it and enter it on your job page to confirm arrival.",
    },
    {
      title: "Direct Host Payment Rules",
      description: "Hosts pay your full wage and transport allowance directly in cash or EFT upon job completion. SIZA does not hold or skim any part of your daily wage.",
    },
    {
      title: "Fair Rotation & Job Offers",
      description: "All approved helpers in a suburb receive fair access to job offers. The first helper to accept is confirmed for the job.",
    },
    {
      title: "Reporting Cancellations or Issues",
      description: "If a host is unreachable or cancels upon arrival, submit a report immediately from the job details page or support menu so our team can record it.",
    },
  ];

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
              Account & Settings
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
        {/* Account Details Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-base">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <p className="text-xs text-neutral-500 font-mono">
                  Helper ID: {actor.userId.slice(0, 8)}...
                </p>
              </div>
            </div>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-red-50 text-neutral-800 hover:text-red-700 text-xs font-semibold transition-colors"
              >
                <LogOut className="size-3.5" />
                <span>Log Out</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Mail className="size-3.5 text-neutral-400" />
                Email Address
              </span>
              <p className="font-semibold text-neutral-900">{user?.email || "—"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Phone className="size-3.5 text-neutral-400" />
                Phone Number
              </span>
              <p className="font-semibold text-neutral-900">{profile?.phone || "—"}</p>
            </div>
          </div>
        </div>

        {/* Helper Guides & How-To Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <BookOpen className="size-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-neutral-900">
              Helper Guides & How-To Info
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guides.map((guide, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-2 hover:border-black/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    {guide.title}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  {guide.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Account Options & Legal */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">
            Privacy & Legal
          </h2>

          <div className="divide-y divide-neutral-100">
            <Link
              href="/terms"
              className="flex items-center justify-between py-3.5 text-sm text-neutral-700 hover:text-black transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <FileText className="size-4 text-neutral-400" />
                Terms of Service
              </span>
              <ChevronRight className="size-4 text-neutral-400" />
            </Link>

            <Link
              href="/privacy"
              className="flex items-center justify-between py-3.5 text-sm text-neutral-700 hover:text-black transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <ShieldCheck className="size-4 text-neutral-400" />
                Privacy Policy (POPIA)
              </span>
              <ChevronRight className="size-4 text-neutral-400" />
            </Link>

            <Link
              href="/helper/report"
              className="flex items-center justify-between py-3.5 text-sm text-neutral-700 hover:text-black transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <HelpCircle className="size-4 text-neutral-400" />
                Contact Administrator / Support
              </span>
              <ChevronRight className="size-4 text-neutral-400" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

