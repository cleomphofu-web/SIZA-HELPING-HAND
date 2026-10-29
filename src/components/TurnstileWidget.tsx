"use client";

import Script from "next/script";
import { t } from "@/content/t";

export function TurnstileWidget({ siteKey, responseFieldName = "turnstileToken" }: { siteKey: string; responseFieldName?: string }) {
  if (!siteKey) {
    return <p className="phase-a-notice" role="alert">{t("account.turnstile.unavailable")}</p>;
  }

  return (
    <>
      <p className="phase-a-notice">{t("account.label.turnstile")}</p>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={siteKey} data-response-field-name={responseFieldName} data-theme="light" />
    </>
  );
}
