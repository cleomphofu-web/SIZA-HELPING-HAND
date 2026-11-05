"use client";

import { useState } from "react";
import { Check, X, ShieldCheck } from "lucide-react";
import { approveHelper, rejectHelper } from "@/app/(admin)/admin/helpers/actions";

export function VettingForm({ id }: { id: string }) {
  const [checks, setChecks] = useState({
    idMatchesSelfie: false,
    idReadable: false,
    referencesCalled: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ready = Object.values(checks).every(Boolean);

  async function handleApprove() {
    if (!ready || isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      await approveHelper(id, checks);
      setMessage("Helper approved successfully!");
      window.location.reload();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to approve helper");
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (isSubmitting) return;
    if (!confirm("Are you sure you want to decline this application?")) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      await rejectHelper(id);
      setMessage("Helper application declined.");
      window.location.reload();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to decline application");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
        <ShieldCheck className="size-4 text-neutral-700" />
        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
          Required before approval
        </h3>
      </div>

      <div className="space-y-3">
        {[
          { key: "idMatchesSelfie", label: "ID matches selfie photo" },
          { key: "idReadable", label: "ID document is fully readable" },
          { key: "referencesCalled", label: "Reference has been contacted" },
        ].map(({ key, label }) => {
          const checked = checks[key as keyof typeof checks];
          return (
            <label
              key={key}
              className="flex items-start gap-3 text-xs font-medium text-neutral-800 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  setChecks({ ...checks, [key]: e.target.checked })
                }
                className="mt-0.5 rounded border-neutral-300 text-black focus:ring-black size-4"
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>

      {message && (
        <p className="text-xs font-semibold p-2.5 rounded-lg bg-neutral-100 text-neutral-800 text-center">
          {message}
        </p>
      )}

      <div className="space-y-2 pt-2">
        <button
          disabled={!ready || isSubmitting}
          onClick={handleApprove}
          className="w-full h-12 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          type="button"
        >
          <Check className="size-4" />
          <span>{isSubmitting ? "Processing…" : "Approve Helper"}</span>
        </button>

        <button
          disabled={isSubmitting}
          onClick={handleReject}
          className="w-full min-h-[44px] rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          type="button"
        >
          <X className="size-4" />
          <span>Reject application</span>
        </button>
      </div>
    </div>
  );
}
