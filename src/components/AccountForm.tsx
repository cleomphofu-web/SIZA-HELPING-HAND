"use client";

import { useState, type FormEvent } from "react";
import { t } from "@/content/t";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type AccountFormProps = { mode: "signup" | "login"; defaultRole?: "host" | "helper"; turnstileSiteKey: string };

export function AccountForm({ mode, defaultRole = "host", turnstileSiteKey }: AccountFormProps) {
  const signup = mode === "signup";
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [challengeRequired, setChallengeRequired] = useState(signup);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || ((signup || challengeRequired) && !turnstileSiteKey)) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const token = formData.get("turnstileToken");
    if ((signup || challengeRequired) && turnstileSiteKey && (!token || String(token).trim() === "")) {
      setMessage("Please complete the verification check before continuing.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const result = await response.json() as { ok?: boolean; data?: { destination?: string }; error?: { code?: string; message?: string } };
      if (result.error?.code === "challenge_required") {
        setChallengeRequired(true);
      } else {
        try { window.turnstile?.reset(); } catch { /* ignore */ }
      }
      if (signup && response.status === 202 && result.ok) {
        setComplete(true);
        setMessage(t("account.success"));
      } else if (!signup && response.ok && result.ok && (result.data?.destination === "/app" || result.data?.destination === "/helper")) {
        window.location.assign(result.data.destination);
      } else {
        setMessage(result.error?.message ?? t("account.error"));
      }
    } catch {
      setMessage(t("account.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="phase-a-shell">
      <div className="phase-a-card">
        <p className="starter-eyebrow">SIZA</p>
        <h1>{t(signup ? "account.signup.title" : "account.login.title")}</h1>
        <p className="starter-copy">{t(signup ? "account.signup.body" : "account.login.body")}</p>
        {complete ? <p className="phase-a-notice" role="status">{message}</p> : (
          <form className="phase-a-form" onSubmit={submit}>
            {signup ? <>
              <label>{t("account.label.role")}<span className="phase-a-role">{t(defaultRole === "host" ? "account.role.host" : "account.role.helper")}</span><input type="hidden" name="role" value={defaultRole} /></label>
              <label>{t("account.label.first_name")}<input name="firstName" required maxLength={80} autoComplete="given-name" /></label>
              <label>{t("account.label.last_name")}<input name="lastName" required maxLength={120} autoComplete="family-name" /></label>
              <label>{t("account.label.phone")}<input name="phone" required type="tel" inputMode="tel" autoComplete="tel" /></label>
            </> : null}
            <label>{t("account.label.email")}<input name="email" required type="email" maxLength={254} autoComplete="email" /></label>
            <label>{t("account.label.password")}<input name="password" required type="password" minLength={signup ? 12 : 1} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} /></label>
            {signup ? <>
              <input type="hidden" name="termsVersion" value="v1" />
              <input type="hidden" name="privacyVersion" value="v1" />
              <label className="phase-a-check"><input type="checkbox" name="termsAccepted" required />{t("account.label.terms")}</label>
              <label className="phase-a-check"><input type="checkbox" name="privacyAccepted" required />{t("account.label.privacy")}</label>
              <p className="phase-a-notice">{t("account.notice")}</p>
            </> : null}
            <input className="sr-only" tabIndex={-1} aria-hidden="true" name="honeypot" autoComplete="off" />
            {signup || challengeRequired ? <TurnstileWidget siteKey={turnstileSiteKey} /> : null}
            {(signup || challengeRequired) && !turnstileSiteKey ? <p className="phase-a-notice" role="alert">{t("account.turnstile.unavailable")}</p> : null}
            <button className="phase-a-button" type="submit" disabled={pending || ((signup || challengeRequired) && !turnstileSiteKey)}>{t(pending ? "button.sending" : "button.continue")}</button>
            <p className="phase-a-notice" role="status" aria-live="polite">{message}</p>
          </form>
        )}
      </div>
    </main>
  );
}
