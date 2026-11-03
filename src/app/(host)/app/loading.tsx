import { t } from "@/content/t";

export default function HostAppLoading() {
  return (
    <main className="phase-a-shell">
      <div className="host-home-card" aria-busy="true">
        <p className="starter-eyebrow">siZa / HOST</p>
        <p role="status" aria-live="polite">{t("host.home.loading")}</p>
      </div>
    </main>
  );
}
