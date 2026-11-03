"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, Ticket, AlertCircle } from "lucide-react";

type HelperSubscriptionBannerProps = {
  firstJobCompletedAt: string | null;
  subscriptionStatus: string;
  subscriptionPaidUntil: string | null;
};

export function HelperSubscriptionBanner({
  firstJobCompletedAt,
  subscriptionStatus,
  subscriptionPaidUntil,
}: HelperSubscriptionBannerProps) {
  const [provider, setProvider] = useState<"1voucher" | "ott" | "blu_voucher">("1voucher");
  const [pin, setPin] = useState("");
  const [periodMonths, setPeriodMonths] = useState<1 | 3 | 6>(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if helper is past their first job and has no active subscription
  const isPastFirstJob = Boolean(firstJobCompletedAt);
  const isActive = subscriptionStatus === "active" && subscriptionPaidUntil && new Date(subscriptionPaidUntil).getTime() > Date.now();

  if (!isPastFirstJob) {
    // Helper is still on their free first job!
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <p className="font-bold">First Completed Job Free</p>
          <p className="text-emerald-700">
            Your first completed job on siZa has zero subscription fees. You receive 100% of your earnings directly from the host.
          </p>
        </div>
      </div>
    );
  }

  if (isActive) {
    const formattedDate = new Date(subscriptionPaidUntil!).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return (
      <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="size-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-white">Active Helper Plan</p>
            <p className="text-white/60">Subscription active until {formattedDate}. You receive all fair rotation offers.</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
          Active
        </span>
      </div>
    );
  }

  // The helper has finished their first job and needs to subscribe to see new jobs
  async function handleSubmitVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/helper/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          pin: pin.trim(),
          periodMonths,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatusMessage("Voucher submitted successfully! It is now being verified so your account can be activated.");
        setPin("");
      } else {
        setStatusMessage(data.error?.message || "Could not submit voucher. Please check your PIN and try again.");
      }
    } catch {
      setStatusMessage("Could not submit voucher. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-sm space-y-5">
      <div className="flex items-start gap-3.5">
        <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="size-5 text-amber-700" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-amber-950">
            First Job Completed — Subscription Required to View New Jobs
          </h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            Congratulations on completing your first job! In accordance with siZa Fair Rotation policy, your free introductory job has been completed. To keep receiving high-paying job offers in your selected suburbs, renew your helper plan below.
          </p>
        </div>
      </div>

      {/* Voucher Payment Form */}
      <div className="bg-white p-5 rounded-2xl border border-amber-200/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider">
          <Ticket className="size-4 text-emerald-600" />
          <span>Pay via Voucher (1Voucher, OTT, Blu Voucher)</span>
        </div>
        <p className="text-xs text-neutral-500">
          Buy a voucher at any Shoprite, Checkers, Flash vendor, PEP, or Boxer, then enter the 16-digit voucher PIN below.
        </p>

        <form onSubmit={handleSubmitVoucher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Voucher Type
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as "1voucher" | "ott" | "blu_voucher")}
                className="w-full h-11 px-3 rounded-xl border border-neutral-300 bg-neutral-50 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-black"
              >
                <option value="1voucher">1Voucher</option>
                <option value="ott">OTT Voucher</option>
                <option value="blu_voucher">Blu Voucher</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Plan Period
              </label>
              <select
                value={periodMonths}
                onChange={(e) => setPeriodMonths(Number(e.target.value) as 1 | 3 | 6)}
                className="w-full h-11 px-3 rounded-xl border border-neutral-300 bg-neutral-50 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-black"
              >
                <option value={1}>1 Month (R150)</option>
                <option value={3}>3 Months (R400)</option>
                <option value={6}>6 Months (R750)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Voucher PIN / Code
              </label>
              <input
                type="text"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. 1234 5678 9012 3456"
                className="w-full h-11 px-3 rounded-xl border border-neutral-300 bg-neutral-50 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-neutral-100 text-xs font-medium text-neutral-800">
              {statusMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-400">
              Zero automatic debit orders. You pay on purpose.
            </span>
            <button
              type="submit"
              disabled={submitting || !pin.trim()}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submitting ? "Verifying..." : "Submit Voucher & Activate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
