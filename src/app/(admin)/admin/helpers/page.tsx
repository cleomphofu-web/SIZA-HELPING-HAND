import Link from "next/link";
import { requireAdmin } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminHelpersPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: helperDetails } = await supabase.from("helper_details").select("user_id, suburbs, services, status, created_at").order("created_at", { ascending: false });
  const ids = helperDetails?.map((helper) => helper.user_id) ?? [];
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, first_name, last_name, phone").in("id", ids) : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const helpers = (helperDetails ?? []).map((helper) => ({ ...helper, profile: profileById.get(helper.user_id) }));

  return (
    <AdminShell>
      <div className="admin-main">
        <p className="siza-label">Admin / helpers</p>
        <h1 className="admin-title">Review applications.</h1>
        <p className="siza-body mt-8">Approve only when ID matches selfie, the ID is readable, and both references have been called.</p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Suburbs</th><th>Services</th><th>Status</th><th>Submitted</th><th>Contact</th></tr></thead>
            <tbody>
              {(helpers ?? []).map((helper) => (
                <tr key={helper.user_id}>
                  <td><Link href={`/admin/helpers/${helper.user_id}`}>{helper.profile?.first_name} {helper.profile?.last_name}</Link><span className="block mt-1 text-xs text-[#666]">{helper.user_id}</span></td>
                  <td>{helper.suburbs.join(", ")}</td>
                  <td>{helper.services.join(", ")}</td>
                  <td><span className="admin-status">{helper.status}</span></td>
                  <td className="mono">{new Date(helper.created_at).toLocaleDateString("en-ZA")}</td>
                  <td>{helper.profile?.phone ? <a className="text-[#4f7d32] underline" href={`https://wa.me/${helper.profile.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Message on WhatsApp</a> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!helpers?.length ? <p className="admin-empty">No helper applications yet.</p> : null}
        </div>
      </div>
    </AdminShell>
  );
}

