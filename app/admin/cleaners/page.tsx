import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminCleanersPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: cleaners } = await supabase.from("cleaners").select("id, full_name, phone, email, suburbs, services, status, created_at").order("created_at", { ascending: false });

  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">Admin / cleaners</p>
        <h1 className="admin-title">Review applications.</h1>
        <p className="siza-body mt-8">Approve only when ID matches selfie, the ID is readable, and both references have been called.</p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Suburbs</th><th>Services</th><th>Status</th><th>Submitted</th><th>Contact</th></tr></thead>
            <tbody>
              {(cleaners ?? []).map((cleaner) => (
                <tr key={cleaner.id}>
                  <td><Link href={`/admin/cleaners/${cleaner.id}`}>{cleaner.full_name}</Link><span className="block mt-1 text-xs text-[#666]">{cleaner.email}</span></td>
                  <td>{cleaner.suburbs.join(", ")}</td>
                  <td>{cleaner.services.join(", ")}</td>
                  <td><span className="admin-status">{cleaner.status}</span></td>
                  <td className="mono">{new Date(cleaner.created_at).toLocaleDateString("en-ZA")}</td>
                  <td><a className="text-[#4f7d32] underline" href={`https://wa.me/${cleaner.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Message on WhatsApp</a></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cleaners?.length ? <p className="admin-empty">No cleaner applications yet.</p> : null}
        </div>
      </div>
    </AdminShell>
  );
}

