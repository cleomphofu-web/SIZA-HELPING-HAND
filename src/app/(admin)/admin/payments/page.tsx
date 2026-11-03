import { requireAdmin } from "@/server/policies/auth";
import { AdminShell } from "@/components/AdminShell";
import { getAdminSubscriptionPayments, type AdminSubscriptionRecord } from "@/server/views/admin-subscription";
import { RecordPaymentForm } from "./RecordPaymentForm";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const paymentsResult = await getAdminSubscriptionPayments();
  const payments: AdminSubscriptionRecord[] = paymentsResult.ok ? paymentsResult.data : [];

  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">siZa / payments</p>
        <h1 className="admin-title">Helper Subscriptions & Payments</h1>
        <p className="admin-subtitle">
          Record cleared prepaid subscription payments received via EFT or direct transfer.
        </p>

        <div style={{ marginTop: "24px", marginBottom: "32px", maxWidth: "600px" }}>
          <RecordPaymentForm />
        </div>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px" }}>Recent Cleared Payments</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Helper</th>
                <th>Amount</th>
                <th>Period</th>
                <th>Reference</th>
                <th>Valid Until</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: AdminSubscriptionRecord) => (
                <tr key={p.id}>
                  <td>{p.helperName}</td>
                  <td>R{(p.amountCents / 100).toFixed(2)}</td>
                  <td>{p.periodMonths} {p.periodMonths === 1 ? "month" : "months"}</td>
                  <td><code>{p.reference}</code></td>
                  <td>{new Date(p.paidUntilAfter).toLocaleDateString("en-ZA")}</td>
                  <td>{new Date(p.createdAt).toLocaleString("en-ZA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments.length ? <p className="admin-empty">No subscription payments recorded yet.</p> : null}
        </div>
      </div>
    </AdminShell>
  );
}
