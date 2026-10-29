import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { getSignedDocumentUrl } from "@/app/(admin)/admin/helpers/actions";
import { AdminShell } from "@/components/AdminShell";
import { VettingForm } from "./HelperVettingForm";

export default async function HelperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const [{ data: helper }, { data: profile }, { data: documents }, { data: reference }] = await Promise.all([
    supabase.from("helper_details").select("user_id, date_of_birth, job_title, services, suburbs, bio, experience_note, rate_note, status, created_at").eq("user_id", id).maybeSingle(),
    supabase.from("profiles").select("first_name, last_name, phone").eq("id", id).maybeSingle(),
    supabase.from("helper_private_docs").select("id, type").eq("helper_id", id),
    supabase.from("phase_a_helper_references").select("name, phone").eq("helper_id", id).maybeSingle(),
  ]);
  if (!helper || !profile) notFound();
  const signedDocuments = await Promise.all((documents ?? []).map(async (document) => ({ ...document, url: await getSignedDocumentUrl(document.id) })));
  return <AdminShell><div className="admin-main"><Link className="siza-link" href="/admin/helpers">Back to helpers</Link><p className="siza-label mt-12">Helper application / {helper.status}</p><h1 className="admin-title">{profile.first_name} {profile.last_name}</h1><div className="admin-detail-grid"><section><dl className="admin-definition-list"><div><dt>Contact</dt><dd>{profile.phone}</dd></div><div><dt>Reference</dt><dd>{reference ? `${reference.name} (${reference.phone})` : "None provided"}</dd></div><div><dt>Job title</dt><dd>{helper.job_title}</dd></div><div><dt>Suburbs</dt><dd>{helper.suburbs.join(", ")}</dd></div><div><dt>Services</dt><dd>{helper.services.join(", ")}</dd></div><div><dt>Bio</dt><dd>{helper.bio || "—"}</dd></div><div><dt>Experience</dt><dd>{helper.experience_note || "—"}</dd></div><div><dt>Rate note</dt><dd>{helper.rate_note || "—"}</dd></div></dl></section><aside><div className="admin-panel"><p className="admin-panel-title">Private documents</p><ul className="admin-document-list">{signedDocuments.map((document) => <li key={document.id}><a href={document.url} target="_blank" rel="noreferrer">Open {document.type}</a></li>)}</ul></div>{helper.status === "pending" ? <VettingForm id={helper.user_id} /> : null}</aside></div></div></AdminShell>;
}
