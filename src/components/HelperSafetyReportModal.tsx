"use client";

import { useState } from "react";
import {
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  MapPinOff,
  Banknote,
  UserX,
} from "lucide-react";
import { t } from "@/content/t";

export interface HelperSafetyReportModalProps {
  bookingId: string;
  initiallyOpen?: boolean;
  onSubmitted?: () => void;
}

type Category = "no_show" | "safety" | "payment" | "conduct" | "other";

const CATEGORIES: Array<{
  id: Category;
  label: string;
  icon: typeof AlertTriangle;
}> = [
  { id: "safety", label: "Safety Concern / Unsafe", icon: AlertTriangle },
  { id: "no_show", label: "Host Unreachable / Locked Out", icon: MapPinOff },
  { id: "payment", label: "Payment / Rate Issue", icon: Banknote },
  { id: "conduct", label: "Host Misconduct", icon: UserX },
  { id: "other", label: "Other Issue", icon: ShieldAlert },
];

const PRESET_CHIPS: Record<Category, string[]> = {
  safety: [
    "Unsafe property condition",
    "Aggressive dog on premises",
    "Felt unsafe / threatened",
  ],
  no_show: [
    "Gate locked / no answer after 15 mins",
    "Host phone goes straight to voicemail",
    "Incorrect address on booking",
  ],
  payment: [
    "Host refused agreed transport allowance",
    "Host offered less than booked rate",
    "Payment dispute on site",
  ],
  conduct: [
    "Unreasonable extra tasks demanded",
    "Disrespectful / inappropriate behavior",
  ],
  other: [
    "Emergency cancellation needed",
    "Water or electricity cut off on site",
  ],
};

export function HelperSafetyReportModal({
  bookingId,
  initiallyOpen = false,
  onSubmitted,
}: HelperSafetyReportModalProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [category, setCategory] = useState<Category>("safety");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePresetClick = (preset: string) => {
    setDescription((prev) => (prev ? `${prev}. ${preset}` : preset));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage("Please describe what happened so our team can help.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          bookingId,
          subjectId: null,
          category,
          text: description.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setIsSubmitted(true);
        if (onSubmitted) onSubmitted();
      } else {
        setErrorMessage(data?.error?.message ?? "Could not submit report. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
      >
        <ShieldAlert className="size-4 text-rose-600" />
        <span>Report Issue / Safety Help</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-neutral-900">
                {t("helper.safety.success_title")}
              </h2>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                {t("helper.safety.success_body")}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 text-left space-y-1">
              <p className="font-semibold text-neutral-900">What happens next:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>siZa admin is alerted immediately</li>
                <li>The report is linked to this booking record</li>
                <li>Support will follow up via your registered phone number</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-2 px-6 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Helper Support & Safety
                </span>
              </div>
              <h2
                id="safety-modal-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900"
              >
                {t("helper.safety.title")}
              </h2>
              <p className="text-xs text-neutral-500">
                {t("helper.safety.subtitle")}
              </p>
            </div>

            {/* Direct South African Emergency Callout */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-start gap-2 text-xs text-rose-900 font-semibold">
                <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{t("helper.safety.sos_notice")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="tel:10111"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <PhoneCall className="size-3.5" />
                  <span>{t("helper.safety.call_saps")}</span>
                </a>
                <a
                  href="tel:10177"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <PhoneCall className="size-3.5" />
                  <span>{t("helper.safety.call_medical")}</span>
                </a>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                {t("helper.safety.category_label")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-black bg-black text-white shadow-sm"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <Icon className={`size-3.5 ${isSelected ? "text-white" : "text-neutral-500"}`} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preset Helper Chips for One-Tap Input */}
            {PRESET_CHIPS[category] && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Quick Details:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CHIPS[category].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label
                htmlFor="safetyDescription"
                className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block"
              >
                Explanation / Details
              </label>
              <textarea
                id="safetyDescription"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
                placeholder={t("helper.safety.details_placeholder")}
                className="w-full p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                {errorMessage}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t("helper.safety.submitting")}</span>
                  </>
                ) : (
                  <span>{t("helper.safety.submit")}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-black text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
