"use client";

import { useState } from "react";
import { Navigation, MessageCircle, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { t } from "@/content/t";
import { FlowButton } from "@/components/ui/flow-button";

interface OnMyWayButtonProps {
  bookingId: string;
}

const ETA_OPTIONS = [15, 30, 45, 60] as const;

export function OnMyWayButton({ bookingId }: OnMyWayButtonProps) {
  const [selectedEta, setSelectedEta] = useState<number>(30);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [reportedEta, setReportedEta] = useState<number>(30);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/on-my-way`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etaMinutes: selectedEta }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setWhatsappUrl(data?.whatsappUrl ?? null);
        setReportedEta(data?.etaMinutes ?? selectedEta);
        setStatus("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Could not update status.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">{t("tracking.on_my_way_title")}</p>
            <p className="text-xs text-emerald-700">
              Host notified in-app: ETA ~{reportedEta} minutes. Travel safely!
            </p>
          </div>
        </div>
        {whatsappUrl && (
          <FlowButton
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="emerald"
            size="md"
            icon={<MessageCircle className="size-4" />}
            text={t("tracking.send_whatsapp")}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
          <Clock className="size-3.5 text-neutral-400" />
          <span>Estimated arrival time</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ETA_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setSelectedEta(mins)}
              disabled={status === "loading"}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedEta === mins
                  ? "bg-black text-white shadow-sm"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              }`}
            >
              ~{mins} mins
            </button>
          ))}
        </div>
      </div>

      <FlowButton
        onClick={handleClick}
        loading={status === "loading"}
        disabled={status === "loading"}
        variant="primary"
        size="md"
        icon={<Navigation className="size-4" />}
        text={status === "loading" ? t("button.sending") : `Confirm On My Way (~${selectedEta}m)`}
      />

      {errorMsg && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
