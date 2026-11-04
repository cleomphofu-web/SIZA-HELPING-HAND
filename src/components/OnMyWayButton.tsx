"use client";

import { useState } from "react";
import { Navigation, MessageCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { t } from "@/content/t";

interface OnMyWayButtonProps {
  bookingId: string;
}

export function OnMyWayButton({ bookingId }: OnMyWayButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    if (status !== "idle") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/on-my-way`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setWhatsappUrl(data?.whatsappUrl ?? null);
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
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-bold">{t("tracking.on_my_way_title")}</p>
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors"
          >
            <MessageCircle className="size-4" />
            {t("tracking.send_whatsapp")}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
      >
        <Navigation className="size-4" />
        {status === "loading" ? t("button.sending") : t("tracking.on_my_way")}
      </button>
      {errorMsg && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}

