import { t } from "@/content/t";
import { AdminShell } from "@/components/AdminShell";

export default function AdminOverviewLoading() {
  return <AdminShell><div className="admin-main" aria-busy="true">
    <p className="siza-label">{t("admin.overview.eyebrow")}</p>
    <h1 className="admin-title">{t("admin.overview.title")}</h1>
    <p role="status" aria-live="polite">{t("admin.overview.loading")}</p>
    <div className="admin-overview-skeleton" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} />)}</div>
  </div></AdminShell>;
}
