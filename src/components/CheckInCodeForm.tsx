"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { t } from "@/content/t";
import { FlowButton } from "@/components/ui/flow-button";

export function CheckInCodeForm({ bookingId }: { bookingId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function issue() {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/host/requests/check-in-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const result = (await response.json()) as { ok: boolean; data?: { code: string } };
      if (result.ok && result.data) {
        setCode(result.data.code);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phase-a-code space-y-3">
      {!code ? (
        <FlowButton
          variant="primary"
          icon={<KeyRound className="size-4" />}
          loading={loading}
          onClick={issue}
          type="button"
        >
          {t("host.request.issue_code")}
        </FlowButton>
      ) : null}
      {code ? (
        <div className="p-4 rounded-2xl bg-neutral-900 text-white inline-block">
          <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">Check-in code</p>
          <p className="phase-a-code-value text-3xl font-mono font-bold tracking-[0.25em]" aria-live="polite">
            {code}
          </p>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-xs text-rose-600 font-semibold">{t("phase_a.error")}</p> : null}
    </div>
  );
}
