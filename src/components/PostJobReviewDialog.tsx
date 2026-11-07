"use client";

import { useState } from "react";
import { Star, CheckCircle2, ThumbsUp, ThumbsDown, MessageSquare, Sparkles, Loader2, X } from "lucide-react";
import { t } from "@/content/t";

export interface PostJobReviewDialogProps {
  bookingId: string;
  helperId: string;
  helperFirstName: string;
  initiallyOpen?: boolean;
  onSubmitted?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Below Expectations",
  3: "Good Clean",
  4: "Very Good Clean",
  5: "Exceptional / 5 Stars",
};

const QUICK_TAGS = [
  "Punctual & On Time",
  "Thorough Cleaning",
  "Friendly & Polite",
  "Attention to Detail",
  "Hard Working",
];

export function PostJobReviewDialog({
  bookingId,
  helperId,
  helperFirstName,
  initiallyOpen = false,
  onSubmitted,
}: PostJobReviewDialogProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [intent, setIntent] = useState<"yes" | "no">("yes");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeRating = hoverRating ?? rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const combinedFeedback = [
        selectedTags.length > 0 ? `Highlights: ${selectedTags.join(", ")}` : null,
        comment.trim() ? comment.trim() : null,
      ]
        .filter(Boolean)
        .join(" — ");

      const res = await fetch("/api/host/repeat-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          helperId,
          intent,
          rating,
          feedback: combinedFeedback || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setIsSubmitted(true);
        if (onSubmitted) onSubmitted();
      } else {
        setErrorMessage(data?.error?.message ?? "Could not submit review. Please try again.");
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
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
      >
        <Star className="size-3.5 text-amber-400 fill-amber-400" />
        <span>Rate Helper & Feedback</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-dialog-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-neutral-900">
                {t("host.feedback.thank_you")}
              </h2>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                {t("host.feedback.thank_you_body")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 px-6 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="size-3 text-amber-600" />
                Post-Job Feedback
              </span>
              <h2
                id="review-dialog-title"
                className="text-2xl font-bold tracking-tight text-neutral-900"
              >
                {t("host.feedback.title")}
              </h2>
              <p className="text-xs text-neutral-500">
                Rate your experience with <strong>{helperFirstName}</strong> to recognize great work.
              </p>
            </div>

            {/* Interactive Star Rating */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block">
                {t("host.feedback.rate_helper")}
              </span>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-all focus:outline-none"
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`size-8 transition-colors ${
                        star <= activeRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-neutral-800 min-h-[1.25rem]">
                {RATING_LABELS[activeRating] || ""}
              </p>
            </div>

            {/* Would you book again? Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                {t("host.feedback.repeat_question", { firstName: helperFirstName })}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIntent("yes")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    intent === "yes"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <ThumbsUp className="size-4 text-emerald-600" />
                  <span>{t("host.feedback.repeat_yes")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntent("no")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    intent === "no"
                      ? "border-neutral-400 bg-neutral-100 text-neutral-900 ring-1 ring-neutral-400"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <ThumbsDown className="size-4 text-neutral-500" />
                  <span>{t("host.feedback.repeat_no")}</span>
                </button>
              </div>
            </div>

            {/* Quick Positive Highlight Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                {t("host.feedback.tags_label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-black text-white"
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment */}
            <div className="space-y-1.5">
              <label
                htmlFor="feedbackComment"
                className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5"
              >
                <MessageSquare className="size-3.5 text-neutral-500" />
                Additional Comments (Optional)
              </label>
              <textarea
                id="feedbackComment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                placeholder={t("host.feedback.comment_placeholder")}
                className="w-full p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                {errorMessage}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t("host.feedback.submitting")}</span>
                  </>
                ) : (
                  <span>{t("host.feedback.submit")}</span>
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

