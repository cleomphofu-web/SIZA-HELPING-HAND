import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { getSignedDocumentUrl } from "@/app/(admin)/admin/helpers/actions";
import { AdminShell } from "@/components/AdminShell";
import { VettingForm } from "./HelperVettingForm";

export default async function HelperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const [{ data: helper }, { data: profile }, { data: documents }, { data: reference }] =
    await Promise.all([
      supabase
        .from("helper_details")
        .select(
          "user_id, date_of_birth, job_title, services, suburbs, bio, experience_note, rate_note, status, created_at"
        )
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("helper_private_docs").select("id, type, storage_path").eq("helper_id", id),
      supabase
        .from("phase_a_helper_references")
        .select("name, phone")
        .eq("helper_id", id)
        .maybeSingle(),
    ]);

  if (!helper || !profile) notFound();

  const signedDocuments = await Promise.all(
    (documents ?? []).map(async (document) => {
      let url: string | null = null;
      try {
        if (document.storage_path) {
          const { data } = await supabase.storage
            .from("helper-docs")
            .createSignedUrl(document.storage_path, 3600);
          url = data?.signedUrl ?? null;
        }
      } catch {
        url = null;
      }
      return {
        id: document.id,
        type: document.type,
        url,
      };
    })
  );

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div>
          <Link
            className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
            href="/admin/helpers"
          >
            ← Back to helper applications
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              {profile.first_name} {profile.last_name}
            </h1>
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
          </div>
          <p className="text-xs font-mono text-neutral-400 mt-1">ID: {helper.user_id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-3">
                Application Details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Contact Phone</dt>
                  <dd className="mt-1 font-medium text-neutral-900">{profile.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Date of Birth</dt>
                  <dd className="mt-1 font-medium text-neutral-900">{helper.date_of_birth || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Job Title</dt>
                  <dd className="mt-1 font-medium text-neutral-900">{helper.job_title}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Reference</dt>
                  <dd className="mt-1 font-medium text-neutral-900">
                    {reference ? `${reference.name} (${reference.phone})` : "None provided"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Suburbs</dt>
                  <dd className="mt-1 text-neutral-800">{helper.suburbs.join(", ") || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Services</dt>
                  <dd className="mt-1 text-neutral-800">{helper.services.join(", ") || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Bio</dt>
                  <dd className="mt-1 text-neutral-700 leading-relaxed">{helper.bio || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Experience Note</dt>
                  <dd className="mt-1 text-neutral-700 leading-relaxed">{helper.experience_note || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Rate Note</dt>
                  <dd className="mt-1 text-neutral-700 leading-relaxed">{helper.rate_note || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Documents & Vetting Actions */}
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-3">
                Private Documents
              </h2>
              {signedDocuments.length ? (
                <ul className="space-y-2">
                  {signedDocuments.map((document) => (
                    <li key={document.id}>
                      {document.url ? (
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-900 transition-colors w-full justify-between"
                        >
                          <span className="capitalize">{document.type.replace("_", " ")}</span>
                          <span>Open ↗</span>
                        </a>
                      ) : (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 text-xs text-neutral-400">
                          <span className="capitalize">{document.type.replace("_", " ")}</span>
                          <span>Unavailable</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-neutral-500">No documents uploaded.</p>
              )}
            </div>

            {helper.status === "pending" ? (
              <VettingForm id={helper.user_id} />
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
