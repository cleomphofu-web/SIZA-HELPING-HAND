"use client";

import { useState } from "react";
import { t } from "@/content/t";

export function CheckInCodeForm({ bookingId }: { bookingId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState(false);
  async function issue() {
    setError(false);
    const response = await fetch("/api/host/requests/check-in-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
    const result = await response.json() as { ok: boolean; data?: { code: string } };
    if (result.ok && result.data) setCode(result.data.code); else setError(true);
  }
  return <div className="phase-a-code"><button className="phase-a-button" type="button" onClick={issue}>{t("host.request.issue_code")}</button>{code ? <p className="phase-a-code-value" aria-live="polite">{code}</p> : null}{error ? <p role="alert">{t("phase_a.error")}</p> : null}</div>;
}
