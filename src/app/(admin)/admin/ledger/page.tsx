import { requireAdmin } from "@/server/policies/auth";
import { AdminShell } from "@/components/AdminShell";
import { getAdminLedgerEntries } from "@/server/views/admin-ledger";
import { t } from "@/content/t";

export const metadata = { title: "Ledger & Payouts — siZa Admin" };

function formatZar(cents: bigint) {
  return `R${(Number(cents) / 100).toFixed(2)}`;
}

function kindLabel(kind: string) {
  const map: Record<string, string> = {
    host_payment: "Host payment",
    platform_fee: "Platform fee",
    helper_payable: "Helper payable",
    payout: "Payout (EFT)",
    refund: "Refund",
    held: "Held",
    adjustment: "Adjustment",
  };
  return map[kind] ?? kind;
}

function kindBadgeClass(kind: string) {
  if (kind === "host_payment") return "badge-green";
  if (kind === "platform_fee") return "badge-blue";
  if (kind === "helper_payable") return "badge-amber";
  if (kind === "payout") return "badge-purple";
  if (kind === "refund") return "badge-red";
  return "badge-neutral";
}

export default async function AdminLedgerPage() {
  await requireAdmin();
  const entriesResult = await getAdminLedgerEntries(100);
  const entries = entriesResult.ok ? entriesResult.data : [];

  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">siZa / ledger</p>
        <h1 className="admin-title">{t("admin.ledger.title")}</h1>
        <p className="admin-subtitle">{t("admin.ledger.body")}</p>

        <div className="admin-table-wrap" style={{ marginTop: "24px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Booking</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(entry.createdAt).toLocaleString("en-ZA", {
                      timeZone: "Africa/Johannesburg",
                    })}
                  </td>
                  <td>
                    <code style={{ fontSize: "0.75rem" }}>
                      {entry.bookingId.slice(0, 8)}…
                    </code>
                  </td>
                  <td>
                    <span className={kindBadgeClass(entry.kind)} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      {kindLabel(entry.kind)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {formatZar(entry.amountCents)}
                  </td>
                  <td>{entry.description}</td>
                  <td>
                    {entry.ref ? (
                      <code style={{ fontSize: "0.75rem" }}>{entry.ref}</code>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!entries.length && (
            <p className="admin-empty">{t("admin.ledger.no_entries")}</p>
          )}
        </div>

        {!entriesResult.ok && (
          <p className="admin-empty" style={{ color: "var(--color-danger)" }}>
            Could not load ledger entries. Try refreshing.
          </p>
        )}
      </div>
    </AdminShell>
  );
}

