import { t } from "@/content/t";

export default function HostRequestsLoading() {
  return (
    <main className="phase-a-shell">
      <section className="host-activity-card" aria-busy="true">
        <p role="status" aria-live="polite">{t("host.home.loading")}</p>
        <div className="host-activity-skeleton" aria-hidden="true">
          <span /><span /><span />
        </div>
      </section>
    </main>
  );
}
