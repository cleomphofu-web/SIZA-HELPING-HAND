"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { t } from "@/content/t";

type KycStatus = "pending" | "verified" | "failed" | "none";

interface KycFormProps {
  currentStatus: KycStatus;
  hasConsent: boolean;
}

export function KycForm({ currentStatus, hasConsent: initialConsent }: KycFormProps) {
  const [idNumber, setIdNumber] = useState("");
  const [consent, setConsent] = useState(initialConsent);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (currentStatus === "verified") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
        <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-bold">{t("kyc.verified")}</p>
        </div>
      </div>
    );
  }

  if (currentStatus === "pending") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
        <Clock className="size-5 text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-bold">{t("kyc.pending")}</p>
        </div>
      </div>
    );
  }

  if (currentStatus === "failed") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900">
        <AlertTriangle className="size-5 text-red-600 shrink-0" />
        <div>
          <p className="text-sm font-bold">{t("kyc.failed")}</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!consent) {
      setErrorMsg(t("kyc.error.no_consent"));
      return;
    }

    const digits = idNumber.replace(/\D/g, "");
    if (digits.length !== 13) {
      setErrorMsg(t("kyc.error.invalid_id"));
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/helper/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber: digits, popia_consent: consent }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        if (data?.error?.includes("already")) {
          setErrorMsg(t("kyc.error.already_submitted"));
        } else {
          setErrorMsg(data?.error ?? t("kyc.failed"));
        }
        setStatus("error");
      }
    } catch {
      setErrorMsg(t("kyc.failed"));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
        <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-bold">{t("kyc.pending")}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
      <div className="space-y-1.5">
        <label htmlFor="kyc-id" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
          {t("kyc.id_label")}
        </label>
        <input
          id="kyc-id"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{13}"
          maxLength={13}
          required
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
          placeholder="0000000000000"
          className="w-full h-12 px-4 rounded-xl bg-neutral-50 border border-neutral-300 focus:border-black focus:ring-1 focus:ring-black text-neutral-900 outline-none transition-all font-mono tracking-widest"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 rounded border-neutral-300 accent-black"
        />
        <span className="text-xs text-neutral-600 leading-relaxed">
          {t("kyc.consent_label")}
        </span>
      </label>

      {errorMsg && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full h-12 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer"
      >
        {status === "submitting" ? t("button.sending") : t("kyc.submit")}
      </button>
    </form>
  );
}

