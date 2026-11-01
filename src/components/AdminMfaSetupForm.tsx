"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles, KeyRound } from "lucide-react";
import { t } from "@/content/t";
import {
  signOutFromAdminMfa,
  startAdminMfaEnrollment,
  verifyAdminMfa,
  getDevAdminTotpCode,
} from "@/app/(admin)/admin/mfa/actions";

export function AdminMfaSetupForm({
  factorId,
  error,
}: {
  factorId: string | null;
  error: boolean;
}) {
  const [state, setupAction, pending] = useActionState(startAdminMfaEnrollment, null);
  const secret = state && "enrollment" in state ? state.enrollment : null;
  const activeFactorId = factorId ?? secret?.factorId ?? null;
  const [devCode, setDevCode] = useState("");
  const [quickCode, setQuickCode] = useState<string | null>(null);

  useEffect(() => {
    getDevAdminTotpCode(secret?.secret).then((code) => {
      if (code) setQuickCode(code);
    });
  }, [secret?.secret]);

  function fillQuickCode() {
    if (quickCode) {
      setDevCode(quickCode);
    }
  }

  return (
    <section className="space-y-5" aria-labelledby="admin-mfa-title">
      {error ? (
        <p
          role="alert"
          className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-center font-medium"
        >
          {t("admin.mfa.error")}
        </p>
      ) : null}

      {factorId ? (
        <>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {t("admin.mfa.challenge.body")}
          </p>
          <form action={verifyAdminMfa} className="space-y-4">
            <input type="hidden" name="factorId" value={factorId} />
            <div className="space-y-1.5">
              <label
                htmlFor="admin-mfa-code"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                {t("admin.mfa.code.label")}
              </label>
              <input
                id="admin-mfa-code"
                name="code"
                type="text"
                value={devCode}
                onChange={(e) => setDevCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                placeholder="000000"
                className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white placeholder:text-neutral-500 backdrop-blur-md transition-all text-center tracking-widest text-lg font-mono outline-none"
                required
              />
            </div>

            {quickCode && (
              <button
                type="button"
                onClick={fillQuickCode}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Fill current test code ({quickCode})</span>
              </button>
            )}

            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              type="submit"
            >
              <span>{t("admin.mfa.submit")}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </>
      ) : secret ? (
        <>
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              {t("admin.mfa.secret.label")}
            </span>
            <code className="block p-3 rounded-xl bg-black/60 border border-white/15 font-mono text-sm text-amber-400 break-all select-all text-center">
              {secret.secret}
            </code>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t("admin.mfa.secret.help")}
            </p>
          </div>
          <form action={verifyAdminMfa} className="space-y-4">
            <input type="hidden" name="factorId" value={activeFactorId ?? ""} />
            <div className="space-y-1.5">
              <label
                htmlFor="admin-mfa-code"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
              >
                {t("admin.mfa.code.label")}
              </label>
              <input
                id="admin-mfa-code"
                name="code"
                type="text"
                value={devCode}
                onChange={(e) => setDevCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                placeholder="000000"
                className="w-full h-12 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 focus:border-white/40 focus:bg-white/[0.12] focus:ring-1 focus:ring-white/30 text-white placeholder:text-neutral-500 backdrop-blur-md transition-all text-center tracking-widest text-lg font-mono outline-none"
                required
              />
            </div>

            {quickCode && (
              <button
                type="button"
                onClick={fillQuickCode}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Fill current test code ({quickCode})</span>
              </button>
            )}

            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              type="submit"
            >
              <span>{t("admin.mfa.submit")}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {t("admin.mfa.setup.body")}
          </p>
          {state && "error" in state ? (
            <p
              role="alert"
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-center"
            >
              {t("admin.mfa.setup.error")}
            </p>
          ) : null}
          <form action={setupAction} className="mt-4">
            <input type="hidden" name="intent" value="setup" />
            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              type="submit"
              disabled={pending}
            >
              <KeyRound className="size-4" />
              <span>{pending ? "Setting up…" : t("admin.mfa.setup.button")}</span>
            </button>
          </form>
        </>
      )}

      <form action={signOutFromAdminMfa} className="pt-3 border-t border-white/10 text-center">
        <button
          className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          type="submit"
        >
          {t("admin.mfa.cancel")}
        </button>
      </form>
    </section>
  );
}
