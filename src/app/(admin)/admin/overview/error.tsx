"use client";

import { t } from "@/content/t";
import { AdminShell } from "@/components/AdminShell";

export default function AdminOverviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminShell><div className="admin-main admin-overview-state" role="alert">
    <h1 className="admin-title">{t("admin.overview.error.title")}</h1>
    <p>{t("admin.overview.error.body")}</p>
    <button className="admin-overview-retry" onClick={reset} type="button">{t("admin.overview.retry")}</button>
  </div></AdminShell>;
}
