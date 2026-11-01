import Link from "next/link";
import { requireAdmin } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminHelpersPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: helperDetails } = await supabase
    .from("helper_details")
    .select("user_id, suburbs, services, status, created_at")
    .order("created_at", { ascending: false });
  const ids = helperDetails?.map((helper) => helper.user_id) ?? [];
  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone")
        .in("id", ids)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const helpers = (helperDetails ?? []).map((helper) => ({
    ...helper,
    profile: profileById.get(helper.user_id),
  }));

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            Admin / Helpers
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Review applications
          </h1>
          <p className="text-sm text-neutral-600 mt-2">
            Approve only when ID matches selfie, the ID is readable, and references have been verified.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-800">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Suburbs</th>
                  <th className="px-6 py-4">Services</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {(helpers ?? []).map((helper) => (
                  <tr key={helper.user_id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      <Link
                        href={`/admin/helpers/${helper.user_id}`}
                        className="font-semibold text-neutral-900 hover:underline block"
                      >
                        {helper.profile?.first_name} {helper.profile?.last_name}
                      </Link>
                      <span className="text-xs font-mono text-neutral-400 block mt-0.5">
                        {helper.user_id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {helper.suburbs.join(", ")}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {helper.services.join(", ")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          helper.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : helper.status === "declined" || helper.status === "suspended"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {helper.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                      {new Date(helper.created_at).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/helpers/${helper.user_id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!helpers?.length ? (
            <p className="p-8 text-center text-sm text-neutral-500">
              No helper applications yet.
            </p>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
