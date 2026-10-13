"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type VettingChecklist = {
  idMatchesSelfie: boolean;
  idReadable: boolean;
  referencesCalled: boolean;
};

export async function approveCleaner(id: string, checklist: VettingChecklist) {
  await requireAdmin();
  if (!checklist.idMatchesSelfie || !checklist.idReadable || !checklist.referencesCalled) throw new Error("All vetting checks are required");
  const supabase = createSupabaseAdminClient();
  const vettedAt = new Date().toISOString();
  const freeUntil = new Date();
  freeUntil.setDate(freeUntil.getDate() + 30);
  const { data, error } = await supabase.from("cleaners").update({
    id_matches_selfie: true, id_readable: true, references_called: true, vetted_at: vettedAt,
    status: "approved", approved_at: vettedAt, free_until: freeUntil.toISOString().slice(0, 10),
  }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
  if (error) throw new Error("Could not approve cleaner");
  if (!data) return { alreadyProcessed: true };
  return { approved: true };
}

export async function rejectCleaner(id: string, reason?: string) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("cleaners").update({ status: "rejected", rejection_reason: reason?.trim().slice(0, 1000) || null }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
  if (error) throw new Error("Could not reject cleaner");
  return { rejected: Boolean(data) };
}

export async function getSignedDocumentUrl(documentId: string) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: document, error } = await supabase.from("cleaner_documents").select("storage_path").eq("id", documentId).single();
  if (error || !document) throw new Error("Document unavailable");
  const { data, error: signedError } = await supabase.storage.from("cleaner-docs").createSignedUrl(document.storage_path, 60);
  if (signedError || !data) throw new Error("Document unavailable");
  return data.signedUrl;
}
