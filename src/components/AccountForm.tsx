"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { t } from "@/content/t";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type AccountFormProps = {
  mode: "signup" | "login";
  defaultRole?: "host" | "helper";
  turnstileSiteKey: string;
};

export function AccountForm({
  mode,
  defaultRole = "host",
  turnstileSiteKey,
}: AccountFormProps) {
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
    if (
      (signup || challengeRequired) &&
      turnstileSiteKey &&
      (!token || String(token).trim() === "")
    ) {
      setMessage("Please complete the verification check before continuing.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(
        signup ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        }
      );
      const result = (await response.json()) as {
        ok?: boolean;
        data?: { destination?: string };
        error?: { code?: string; message?: string };
      };
      if (result.error?.code === "challenge_required") {
        setChallengeRequired(true);
      } else {
        try {
          window.turnstile?.reset();
        } catch {
          /* ignore */
        }
      }
      if (signup && response.status === 202 && result.ok) {
        setComplete(true);
        setMessage(t("account.success"));
      } else if (
        !signup &&
        response.ok &&
        result.ok &&
        (result.data?.destination === "/app" ||
          result.data?.destination === "/helper")
      ) {
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

  const roleLabel =
    defaultRole === "host"
      ? t("account.role.host")
      : t("account.role.helper");

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-black text-white">
      {/* SIZA-related atmospheric background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/hero/background%20home%20page%20hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.35] contrast-[1.15] scale-105"
        />
        {/* Liquid dark backdrop and atmospheric horizon glow (Space Login style) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 backdrop-blur-[2px]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-gradient-to-b from-white/12 to-transparent blur-3xl opacity-50 rounded-full"
        />
      </div>

      {/* Liquid Glass Space Card */}
      <div className="relative z-10 w-full max-w-[480px] my-auto mx-auto p-7 sm:p-10 rounded-3xl bg-neutral-950/75 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent">
        {/* Brand Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-white uppercase">
            siZa. {signup ? `${roleLabel} Setup` : "Sign In"}
          </span>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {t(signup ? "account.signup.title" : "account.login.title")}
        </h1>
        <p className="text-sm text-neutral-200 mt-2 leading-relaxed font-normal">
          {t(signup ? "account.signup.body" : "account.login.body")}
        </p>

        {complete ? (
          <div className="mt-8 p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center space-y-4">
            <Mail className="size-10 text-white mx-auto" />
            <p className="text-sm text-white font-medium" role="status">
              {message}
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all"
            >
              Go to log in →
            </Link>
          </div>
        ) : (
          <>
            {/* Social OAuth Options */}
            <div className="mt-6 space-y-3">
              <a
                href={`/api/auth/oauth?provider=google&role=${defaultRole}`}
                className="w-full h-12 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs tracking-wider flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99]"
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>

              <div className="relative flex items-center justify-center my-4 pt-1">
                <div className="border-t border-white/15 w-full" />
                <span className="bg-neutral-950 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 absolute">
                  or with email
                </span>
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={submit}
            >
            {signup ? (
              <>
                {/* Role indicator */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-bold uppercase tracking-wider text-neutral-100">
                    {t("account.label.role")}
                  </span>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-700 text-sm text-white backdrop-blur-md">
                    <span className="font-semibold capitalize text-white">
                      {roleLabel}
                    </span>
                    <span className="text-xs text-neutral-400">Fixed role</span>
                  </div>
                  <input type="hidden" name="role" value={defaultRole} />
                </div>

                {/* First and Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="firstName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-100"
                    >
                      {t("account.label.first_name")}
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      required
                      maxLength={80}
                      autoComplete="given-name"
                      placeholder="e.g. Sipho"
                      className="w-full h-12 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-700 focus:border-white focus:bg-neutral-950 focus:ring-1 focus:ring-white text-white placeholder:text-neutral-400 backdrop-blur-md transition-all text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="lastName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-100"
                    >
                      {t("account.label.last_name")}
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      required
                      maxLength={120}
                      autoComplete="family-name"
                      placeholder="e.g. Dlamini"
                      className="w-full h-12 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-700 focus:border-white focus:bg-neutral-950 focus:ring-1 focus:ring-white text-white placeholder:text-neutral-400 backdrop-blur-md transition-all text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-100"
                  >
                    {t("account.label.phone")}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="082 123 4567"
                    className="w-full h-12 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-700 focus:border-white focus:bg-neutral-950 focus:ring-1 focus:ring-white text-white placeholder:text-neutral-400 backdrop-blur-md transition-all text-sm outline-none"
                  />
                </div>
              </>
            ) : null}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-100"
              >
                {t("account.label.email")}
              </label>
              <input
                id="email"
                name="email"
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full h-12 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-700 focus:border-white focus:bg-neutral-950 focus:ring-1 focus:ring-white text-white placeholder:text-neutral-400 backdrop-blur-md transition-all text-sm outline-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-100"
              >
                {t("account.label.password")}
              </label>
              <input
                id="password"
                name="password"
                required
                type="password"
                minLength={signup ? 12 : 1}
                maxLength={128}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "At least 12 characters" : "••••••••••••"}
                className="w-full h-12 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-700 focus:border-white focus:bg-neutral-950 focus:ring-1 focus:ring-white text-white placeholder:text-neutral-400 backdrop-blur-md transition-all text-sm outline-none"
              />
            </div>

            {signup ? (
              <>
                <input type="hidden" name="termsVersion" value="v1" />
                <input type="hidden" name="privacyVersion" value="v1" />

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      required
                      className="mt-0.5 size-4 rounded border-white/30 bg-neutral-900 text-white focus:ring-white/30"
                    />
                    <span className="text-xs text-neutral-200 leading-relaxed group-hover:text-white transition-colors">
                      {t("account.label.terms")}
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="privacyAccepted"
                      required
                      className="mt-0.5 size-4 rounded border-white/30 bg-neutral-900 text-white focus:ring-white/30"
                    />
                    <span className="text-xs text-neutral-200 leading-relaxed group-hover:text-white transition-colors">
                      {t("account.label.privacy")}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {t("account.notice")}
                </p>
              </>
            ) : null}

            {/* Honeypot */}
            <input
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              name="honeypot"
              autoComplete="off"
            />

            {/* Turnstile verification check */}
            {signup || challengeRequired ? (
              <div className="pt-1 flex justify-center">
                <TurnstileWidget siteKey={turnstileSiteKey} />
              </div>
            ) : null}

            {(signup || challengeRequired) && !turnstileSiteKey ? (
              <p
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs text-center"
                role="alert"
              >
                {t("account.turnstile.unavailable")}
              </p>
            ) : null}

            {/* Error or validation message */}
            {message ? (
              <p
                className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-center font-medium"
                role="alert"
                aria-live="polite"
              >
                {message}
              </p>
            ) : null}

            {/* Submit Action Button */}
            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              type="submit"
              disabled={
                pending ||
                ((signup || challengeRequired) && !turnstileSiteKey)
              }
            >
              {t(pending ? "button.sending" : "button.continue")}
            </button>

            {/* Switch between Login and Signup */}
            <div className="pt-4 border-t border-white/10 text-center">
              {signup ? (
                <p className="text-xs text-neutral-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-white font-medium underline underline-offset-4 hover:text-neutral-200 transition-colors"
                  >
                    Log in
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  Don&apos;t have an account?{" "}
                  <Link
                    href={`/signup?role=${defaultRole}`}
                    className="text-white font-medium underline underline-offset-4 hover:text-neutral-200 transition-colors"
                  >
                    Create account
                  </Link>
                </p>
              )}
            </div>
          </form>
          </>
        )}
      </div>
    </main>
  );
}
