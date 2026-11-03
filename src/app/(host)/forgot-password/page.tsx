"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { t } from "@/content/t";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !email.trim()) return;

    setPending(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), action: "request" }),
      });

      if (!res.ok) {
        setErrorMessage("We could not send a reset link right now. Please try again later.");
        setPending(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="phase-a-shell flex min-h-[70vh] items-center justify-center px-4 py-12">
      <section className="phase-a-card w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {t("account.forgot_password.title")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {t("account.forgot_password.body")}
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200">
              {t("account.forgot_password.success")}
            </div>
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-black"
            >
              {t("account.verify_email.back")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                {t("account.label.email")}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-black focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50"
            >
              {pending ? t("button.sending") : t("account.forgot_password.submit")}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
              >
                {t("account.verify_email.back")}
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
