import { t } from "@/content/t";
import { HostAccountForm, type HostAccountNotice } from "@/components/HostAccountForm";
import type { HostAccountView } from "@/server/views/host-account";
import type { HostProfileView } from "@/server/views/host-profile";

export function HostProfileForm({ profile, titleKey = "host.profile.title", account, accountNotice }: { profile: HostProfileView; titleKey?: "host.profile.title" | "host.onboarding.title"; account?: HostAccountView; accountNotice?: HostAccountNotice }) {
  return (
    <main className="phase-a-shell">
      <div className="host-profile-stack">
        <section className="phase-a-card" aria-labelledby="host-home-profile-title">
          <p className="starter-eyebrow">SIZA / HOST</p>
          <h1 id="host-home-profile-title">{t(titleKey)}</h1>
          <p className="starter-copy">{t("host.onboarding.body")}</p>
          <form className="phase-a-form" action="/api/host/onboarding" method="post">
            <label>{t("host.label.address")}<input name="addressLine" required maxLength={300} autoComplete="street-address" defaultValue={profile.addressLine} /></label>
            <label>{t("host.label.suburb")}<input name="suburb" required maxLength={80} autoComplete="address-level2" defaultValue={profile.suburb} /></label>
            <label>{t("host.label.city")}<input name="city" required maxLength={80} autoComplete="address-level1" defaultValue={profile.city} /></label>
            <label>{t("host.label.notes")}<textarea name="notesDefault" maxLength={2000} rows={4} defaultValue={profile.notesDefault} /></label>
            <button className="phase-a-button" type="submit">{t("button.save")}</button>
          </form>
        </section>
        {account && <HostAccountForm account={account} notice={accountNotice} />}
      </div>
    </main>
  );
}
