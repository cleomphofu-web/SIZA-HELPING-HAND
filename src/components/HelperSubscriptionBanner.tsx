"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  Sparkles,
} from "lucide-react";

type HelperSubscriptionBannerProps = {
  firstJobCompletedAt: string | null;
  subscriptionStatus: string;
  subscriptionPaidUntil: string | null;
  helperId?: string;
  helperPhone?: string;
  yocoUrl?: string;
};

export function HelperSubscriptionBanner({
  firstJobCompletedAt,
  subscriptionStatus,
  subscriptionPaidUntil,
  helperId,
  helperPhone,
  yocoUrl = process.env.NEXT_PUBLIC_YOCO_PAYMENT_LINK_URL || "https://pay.yoco.com/siza",
}: HelperSubscriptionBannerProps) {
  const [referenceInput, setReferenceInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Derive unique reference code
  const cleanPhone = helperPhone ? helperPhone.replace(/[^0-9]/g, "") : "";
  const uniqueReference = helperId
    ? `SIZA-${helperId.slice(0, 8).toUpperCase()}`
    : cleanPhone
    ? `SUB-${cleanPhone.slice(-9)}`
    : "SIZA-HELPER";

  const isPastFirstJob = Boolean(firstJobCompletedAt);
  const [currentTime] = useState(() => Date.now());
  const paidUntilTime = subscriptionPaidUntil ? new Date(subscriptionPaidUntil).getTime() : 0;
  const isActive = subscriptionStatus === "active" && paidUntilTime > currentTime;
  const daysRemaining = isActive ? Math.max(1, Math.ceil((paidUntilTime - currentTime) / (1000 * 60 * 60 * 24))) : 0;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(uniqueReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard write failed
    }
  }

  async function handleSubmitReference(e: React.FormEvent) {
    e.preventDefault();
    const ref = referenceInput.trim();
    if (!ref) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/helper/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: ref,
          periodMonths: 1,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStatusMessage({
          type: "success",
          text: data.data?.message || "Payment reference submitted! Your subscription will be activated shortly.",
        });
        setReferenceInput("");
      } else {
        setStatusMessage({
          type: "error",
          text: data.error?.message || "Could not submit payment reference. Please check and try again.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Could not submit payment reference. Please check your connection or contact WhatsApp support.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Pre-filled WhatsApp message for support
  const whatsappText = encodeURIComponent(
    `Hi siZa Admin, I need help with my R120 helper subscription. My reference is ${uniqueReference}${cleanPhone ? ` (Phone: ${cleanPhone})` : ""}.`
  );
  const whatsappLink = `https://wa.me/27820000000?text=${whatsappText}`;

  // STATE 1: Before First Job Completed (Free introductory job)
  if (!isPastFirstJob) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex items-start gap-3.5 shadow-xs">
        <div className="size-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-emerald-900">Your First Job is 100% Free</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              Introductory Free Job
            </span>
          </div>
          <p className="text-emerald-800 leading-relaxed">
            As a newly approved helper, your first completed job has zero platform fees. You receive 100% of your earnings directly from the host. Only after your first successful job do you subscribe to see more jobs.
          </p>
        </div>
      </div>
    );
  }

  // STATE 2: Active Plan (Show expiry, allow safe early extension)
  if (isActive) {
    const formattedDate = new Date(subscriptionPaidUntil!).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 text-white border border-white/10 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-white">Active Helper Plan</p>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Valid until {formattedDate} ({daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining). You receive all fair rotation offers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            {showGuide ? "Hide Renewal Guide" : "Extend Plan Early"}
          </button>
        </div>

        {/* Safeguard note */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-[11px] flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Payment Safeguard:</strong> Renewing early adds 30 days to the end of your current expiry ({formattedDate}). You will never lose days or be charged double.
          </span>
        </div>

        {/* Optional early renewal guide */}
        {showGuide && (
          <div className="pt-3 border-t border-white/10 space-y-4">
            <PaymentGuideSection
              uniqueReference={uniqueReference}
              copied={copied}
              handleCopy={handleCopy}
              yocoUrl={yocoUrl}
              referenceInput={referenceInput}
              setReferenceInput={setReferenceInput}
              handleSubmitReference={handleSubmitReference}
              submitting={submitting}
              statusMessage={statusMessage}
              whatsappLink={whatsappLink}
            />
          </div>
        )}
      </div>
    );
  }

  // STATE 3: First Job Completed — Plan Required / Paywall
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/40 shadow-lg space-y-6">
      {/* Alert Header */}
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="size-6 text-amber-800" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-900 text-[11px] font-bold uppercase tracking-wider">
              Introductory Free Job Completed
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black text-white text-[11px] font-mono font-bold">
              Fixed Fee: R120 / Month
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Activate Your Monthly Helper Plan
          </h2>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-2xl">
            You completed your free first job! In accordance with the siZa Fair Rotation policy, your introductory job is finished. To unlock new available jobs in your suburbs and keep receiving rotation offers, activate your helper plan for a fixed fee of <strong>R120 for 30 days</strong>.
          </p>
        </div>
      </div>

      {/* Payment Guide */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-neutral-200 shadow-sm space-y-5">
        <PaymentGuideSection
          uniqueReference={uniqueReference}
          copied={copied}
          handleCopy={handleCopy}
          yocoUrl={yocoUrl}
          referenceInput={referenceInput}
          setReferenceInput={setReferenceInput}
          handleSubmitReference={handleSubmitReference}
          submitting={submitting}
          statusMessage={statusMessage}
          whatsappLink={whatsappLink}
        />
      </div>
    </div>
  );
}

// Reusable 3-step payment guide component
function PaymentGuideSection({
  uniqueReference,
  copied,
  handleCopy,
  yocoUrl,
  referenceInput,
  setReferenceInput,
  handleSubmitReference,
  submitting,
  statusMessage,
  whatsappLink,
}: {
  uniqueReference: string;
  copied: boolean;
  handleCopy: () => void;
  yocoUrl: string;
  referenceInput: string;
  setReferenceInput: (val: string) => void;
  handleSubmitReference: (e: React.FormEvent) => void;
  submitting: boolean;
  statusMessage: { type: "success" | "error"; text: string } | null;
  whatsappLink: string;
}) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <span>Simple 3-Step Payment Guide</span>
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Follow these three steps to activate your plan in under 2 minutes. No technical experience required.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Step 01
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold">
                Reference
              </span>
            </div>
            <h4 className="text-xs font-bold text-neutral-900">
              Copy Your Reference Code
            </h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Use this reference when paying on Yoco so your payment connects to your account immediately.
            </p>
          </div>

          <div className="pt-1">
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-white border border-neutral-300 font-mono text-xs font-bold text-neutral-900 text-center select-all">
                {uniqueReference}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Step 02
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                R120 Fixed Fee
              </span>
            </div>
            <h4 className="text-xs font-bold text-neutral-900">
              Pay R120 on Yoco
            </h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Opens our secure Yoco checkout. Pay using your Debit Card, Credit Card, or Capitec Pay.
            </p>
          </div>

          <div className="pt-1">
            <a
              href={yocoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span>Open Yoco & Pay R120</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Step 03
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold">
                Instant Check
              </span>
            </div>
            <h4 className="text-xs font-bold text-neutral-900">
              Activate Your Plan
            </h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Enter your reference or Yoco receipt code below to activate your account.
            </p>
          </div>

          <form onSubmit={handleSubmitReference} className="pt-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                placeholder="e.g. SIZA-... or YCO-..."
                className="flex-1 h-9 px-3 rounded-xl border border-neutral-300 bg-white text-xs font-mono text-neutral-900 focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={submitting || !referenceInput.trim()}
                className="h-9 px-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                {submitting ? "Checking…" : "Activate"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Safeguards & human support footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 border-t border-neutral-100">
        <div className="flex items-center gap-2 text-neutral-600">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Payment Safeguard:</strong> References can only be used once. You are never charged twice.
          </span>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
        >
          <MessageCircle className="size-3.5" />
          <span>Need help? Chat with Admin on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
