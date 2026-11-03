"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { t } from "@/content/t";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setPending(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "update" }),
      });

      if (!res.ok) {
        setErrorMessage("We could not update your password. Your reset link may have expired.");
        setPending(false);
        return;
      }

      setComplete(true);
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
          {t("account.reset_password.title")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {t("account.reset_password.body")}
        </p>

        {complete ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200">
              {t("account.reset_password.success")}
            </div>
            <Link
              href="/login"
              className="inline-block text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-black"
            >
              {t("nav.login")}
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
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                {t("account.label.password")}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-black focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50"
            >
              {pending ? t("button.sending") : t("account.reset_password.submit")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
