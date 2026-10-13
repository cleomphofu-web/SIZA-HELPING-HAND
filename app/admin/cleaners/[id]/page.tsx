import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSignedDocumentUrl } from "@/app/admin/cleaners/actions";
import { AdminShell } from "@/components/AdminShell";
import { VettingForm } from "./VettingForm";

export default async function CleanerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const [{ data: cleaner }, { data: documents }, { data: references }] = await Promise.all([
    supabase.from("cleaners").select("id, full_name, phone, email, suburbs, services, rate_amount, rate_unit, availability, status, created_at").eq("id", id).single(),
    supabase.from("cleaner_documents").select("id, type").eq("cleaner_id", id),
    supabase.from("cleaner_references").select("name, phone").eq("cleaner_id", id),
  ]);
  if (!cleaner) notFound();
  const signedDocuments = await Promise.all((documents ?? []).map(async (document) => ({ ...document, url: await getSignedDocumentUrl(document.id) })));

  return (
    <AdminShell>
      <div className="admin-main">
        <Link className="siza-link" href="/admin/cleaners">Back to cleaners <span aria-hidden="true">↗</span></Link>
        <p className="siza-label mt-12">Cleaner application / {cleaner.status}</p>
        <h1 className="admin-title">{cleaner.full_name}</h1>
        <div className="admin-detail-grid">
          <section>
            <dl className="admin-definition-list">
              <div><dt>Contact</dt><dd>{cleaner.phone}<br />{cleaner.email}<br /><a className="text-[#4f7d32] underline" href={`https://wa.me/${cleaner.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Message on WhatsApp ↗</a></dd></div>
              <div><dt>Suburbs</dt><dd>{cleaner.suburbs.join(", ")}</dd></div>
              <div><dt>Services</dt><dd>{cleaner.services.join(", ")}</dd></div>
              <div><dt>Rate</dt><dd>R{cleaner.rate_amount} / {cleaner.rate_unit}</dd></div>
              <div><dt>Availability</dt><dd>{cleaner.availability}</dd></div>
            </dl>
          </section>
          <aside>
            <div className="admin-panel"><p className="admin-panel-title">Documents</p><ul className="admin-document-list">{signedDocuments.map((document) => <li key={document.id}><a href={document.url} target="_blank" rel="noreferrer">Open {document.type} ↗</a></li>)}</ul></div>
            <div className="admin-panel"><p className="admin-panel-title">References</p><ul className="admin-reference-list">{(references ?? []).map((reference) => <li key={`${reference.name}-${reference.phone}`}>{reference.name}<br /><span className="mono">{reference.phone}</span></li>)}</ul></div>
            {cleaner.status === "pending" ? <VettingForm id={cleaner.id} /> : null}
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

