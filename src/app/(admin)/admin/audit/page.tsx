import Link from "next/link";
import { copy, type CopyKey } from "@/content/copy.generated";
import { t } from "@/content/t";
import { AdminShell } from "@/components/AdminShell";
import { getAdminAuditEvents } from "@/server/views/admin-audit";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function label(keyPrefix: "action" | "entity", value: string) {
  const key = `admin.audit.${keyPrefix}.${value}` as CopyKey;
  return Object.hasOwn(copy, key)
    ? t(key)
    : t(`admin.audit.${keyPrefix}.unknown` as CopyKey);
}

export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const hasCursor = params.before !== undefined || params.id !== undefined;
  const cursor = hasCursor ? { at: params.before, id: params.id } : undefined;
  const result = await getAdminAuditEvents(cursor);

  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">{t("admin.audit.eyebrow")}</p>
        <h1 className="admin-title">{t("admin.audit.title")}</h1>
        <p className="siza-body mt-8">{t("admin.audit.intro")}</p>

        {!result.ok ? (
          <div className="admin-audit-state" role="alert">
            <p>{result.error.code === "validation_failed" ? t("admin.audit.invalid") : t("admin.audit.error")}</p>
            {result.error.code === "validation_failed" ? <Link href="/admin/audit">{t("admin.audit.newest")}</Link> : <Link href="/admin/audit">{t("admin.audit.retry")}</Link>}
          </div>
        ) : result.data.events.length === 0 ? (
          <p className="admin-audit-state" role="status">{t("admin.audit.empty")}</p>
        ) : (
          <section className="admin-audit-section" aria-label={t("admin.audit.list")}>
            {hasCursor ? <p><Link href="/admin/audit">{t("admin.audit.newest")}</Link></p> : null}
            <ol className="admin-audit-list">
              {result.data.events.map((event) => (
                <li key={event.id}>
                  <div>
                    <strong>{label("action", event.action)}</strong>
                    <span>{label("entity", event.entity)}</span>
                  </div>
                  <time dateTime={event.at}>{new Date(event.at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" })}</time>
                </li>
              ))}
            </ol>
            {result.data.hasMore && result.data.nextCursor ? (
              <Link className="admin-audit-next" href={{ pathname: "/admin/audit", query: { before: result.data.nextCursor.at, id: result.data.nextCursor.id } }}>{t("admin.audit.older")}</Link>
            ) : null}
          </section>
        )}
      </div>
    </AdminShell>
  );
}
