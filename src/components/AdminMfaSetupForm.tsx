"use client";

import { useActionState } from "react";
import { t } from "@/content/t";
import { signOutFromAdminMfa, startAdminMfaEnrollment, verifyAdminMfa } from "@/app/(admin)/admin/mfa/actions";

export function AdminMfaSetupForm({ factorId, error }: { factorId: string | null; error: boolean }) {
  const [state, setupAction, pending] = useActionState(startAdminMfaEnrollment, null);
  const secret = state && "enrollment" in state ? state.enrollment : null;
  const activeFactorId = factorId ?? secret?.factorId ?? null;

  return (
    <section className="siza-form" aria-labelledby="admin-mfa-title">
      {error ? <p role="alert">{t("admin.mfa.error")}</p> : null}
      {factorId ? <>
        <p>{t("admin.mfa.challenge.body")}</p>
        <form action={verifyAdminMfa}>
          <input type="hidden" name="factorId" value={factorId} />
          <div className="siza-field">
            <label htmlFor="admin-mfa-code">{t("admin.mfa.code.label")}</label>
            <input id="admin-mfa-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required />
          </div>
          <button className="siza-button siza-button-yellow" type="submit">{t("admin.mfa.submit")}</button>
        </form>
      </> : secret ? <>
        <div className="siza-field">
          <span>{t("admin.mfa.secret.label")}</span>
          <code className="admin-mfa-secret">{secret.secret}</code>
          <p>{t("admin.mfa.secret.help")}</p>
        </div>
        <form action={verifyAdminMfa}>
          <input type="hidden" name="factorId" value={activeFactorId ?? ""} />
          <div className="siza-field">
            <label htmlFor="admin-mfa-code">{t("admin.mfa.code.label")}</label>
            <input id="admin-mfa-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required />
          </div>
          <button className="siza-button siza-button-yellow" type="submit">{t("admin.mfa.submit")}</button>
        </form>
      </> : <>
        <p>{t("admin.mfa.setup.body")}</p>
        {state && "error" in state ? <p role="alert">{t("admin.mfa.setup.error")}</p> : null}
        <form action={setupAction}>
          <input type="hidden" name="intent" value="setup" />
          <button className="siza-button siza-button-yellow" type="submit" disabled={pending}>{t("admin.mfa.setup.button")}</button>
        </form>
      </>}
      <form action={signOutFromAdminMfa} className="admin-mfa-signout">
        <button className="siza-link" type="submit">{t("admin.mfa.cancel")}</button>
      </form>
    </section>
  );
}
