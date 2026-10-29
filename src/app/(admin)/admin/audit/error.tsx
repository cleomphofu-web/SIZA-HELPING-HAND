"use client";

import { t } from "@/content/t";
import { AdminShell } from "@/components/AdminShell";

export default function AdminAuditError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AdminShell>
      <div className="admin-main">
        <h1 className="admin-title">{t("admin.audit.error")}</h1>
        <button className="admin-audit-retry" onClick={reset} type="button">{t("admin.audit.retry")}</button>
      </div>
    </AdminShell>
  );
}
