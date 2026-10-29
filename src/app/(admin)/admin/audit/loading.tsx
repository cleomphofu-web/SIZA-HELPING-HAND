import { t } from "@/content/t";
import { AdminShell } from "@/components/AdminShell";

export default function AdminAuditLoading() {
  return (
    <AdminShell>
      <div className="admin-main" aria-busy="true" aria-live="polite">
        <p className="siza-label">{t("admin.audit.eyebrow")}</p>
        <h1 className="admin-title">{t("admin.audit.title")}</h1>
        <p>{t("admin.audit.loading")}</p>
        <div className="admin-audit-skeleton" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </AdminShell>
  );
}
