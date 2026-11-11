"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { t } from "@/content/t";

type TurnstileOptions = {
  sitekey: string;
  "response-field-name"?: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "expired-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({
  siteKey,
  responseFieldName = "turnstileToken",
}: {
  siteKey: string;
  responseFieldName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = () => {
    const container = containerRef.current;
    if (!container || !window.turnstile || !siteKey) return;

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
      widgetIdRef.current = null;
    }

    // Clear any previous child nodes to prevent duplicated widgets
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    try {
      const id = window.turnstile.render(container, {
        sitekey: siteKey,
        "response-field-name": responseFieldName,
        theme: "light",
      });
      widgetIdRef.current = id;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!siteKey) return;

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);

      return () => {
        clearInterval(interval);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, responseFieldName]);

  if (!siteKey) {
    // Turnstile not configured — render a hidden dummy token so the form submits.
    // The server also allows through when TURNSTILE_SECRET_KEY is unset.
    // TODO(owner): add NEXT_PUBLIC_TURNSTILE_SITE_KEY to Vercel env vars to enable.
    return <input type="hidden" name="turnstileToken" value="unconfigured" />;
  }

  return (
    <>
      <p className="phase-a-notice">{t("account.label.turnstile")}</p>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div
        ref={containerRef}
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-response-field-name={responseFieldName}
        data-theme="light"
      />
    </>
  );
}
