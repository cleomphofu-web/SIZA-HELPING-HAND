import { AccountForm } from "@/components/AccountForm";
import { t } from "@/content/t";

type AccountEntryProps = {
  areas: string;
  enabled: boolean;
  mode: "signup" | "login";
  role?: "host" | "helper";
  supportEmail: string;
  turnstileSiteKey: string;
};

export function AccountEntry({ areas, enabled, mode, role = "host", supportEmail, turnstileSiteKey }: AccountEntryProps) {
  if (enabled) return <AccountForm mode={mode} defaultRole={role} turnstileSiteKey={turnstileSiteKey} />;

  return (
    <main className="phase-a-shell">
      <section className="phase-a-card" aria-labelledby="account-unavailable-title">
        <h1 id="account-unavailable-title">{t("holding.title", { areas })}</h1>
        <p className="text-neutral-700 mt-2">{t("holding.body")}</p>
        <p className="text-neutral-700 mt-1">{t("holding.contact", { supportEmail })}</p>
      </section>
    </main>
  );
}
