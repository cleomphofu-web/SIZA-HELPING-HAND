import { t } from "@/content/t";
import type { HostAccountView } from "@/server/views/host-account";

export type HostAccountNotice = "saved" | "failed" | "rate_limited";

export function HostAccountForm({ account, notice }: { account: HostAccountView; notice?: HostAccountNotice }) {
  return (
    <section className="phase-a-card host-account-card" aria-labelledby="host-contact-title">
      <h2 id="host-contact-title">{t("host.account.contact.title")}</h2>
      <p className="starter-copy">{t("host.account.contact.body")}</p>
      <p className="phase-a-notice">{t("host.account.contact.phone_not_verified")}</p>
      {notice === "saved" && <p className="host-account-result" role="status">{t("host.account.contact.saved")}</p>}
      {notice === "failed" && <p className="host-account-result" role="alert">{t("host.account.contact.failed")}</p>}
      {notice === "rate_limited" && <p className="host-account-result" role="alert">{t("host.account.contact.rate_limited")}</p>}
      <form className="phase-a-form" action="/api/host/account" method="post">
        <label>{t("account.label.first_name")}<input name="firstName" required maxLength={80} autoComplete="given-name" defaultValue={account.firstName} /></label>
        <label>{t("account.label.last_name")}<input name="lastName" required maxLength={120} autoComplete="family-name" defaultValue={account.lastName} /></label>
        <label>{t("account.label.phone")}<input name="phone" type="tel" inputMode="tel" required maxLength={20} autoComplete="tel" defaultValue={account.phone} /></label>
        <button className="phase-a-button" type="submit">{t("button.save")}</button>
      </form>
    </section>
  );
}
