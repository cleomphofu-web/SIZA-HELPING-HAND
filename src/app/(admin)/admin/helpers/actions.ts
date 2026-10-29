"use server";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { HelperDecisionSchema, HelperDocumentIdSchema, HelperSuspensionSchema, HelperVettingChecklistSchema } from "@/server/domain/admin-helper";
import { requireAdmin } from "@/server/policies/auth";
import { runServerActionPipeline } from "@/server/policies/request-pipeline";
import { limitAdminAction } from "@/server/security/admin-rate-limit";
import { reviewHelper } from "@/server/services/admin-helpers";

export type VettingChecklist = {
  idMatchesSelfie: boolean;
  idReadable: boolean;
  referencesCalled: boolean;
};

export async function approveHelper(id: string, checklist: VettingChecklist) {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction, botCheck: async () => true,
    validate: async () => { const parsed = HelperVettingChecklistSchema.safeParse(checklist); return parsed.success && parsed.data.idMatchesSelfie && parsed.data.idReadable && parsed.data.referencesCalled ? { ok: true as const, data: { id, checklist: parsed.data } } : { ok: false as const, error: "checklist" }; },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (input, actor) => {
      const result = await reviewHelper(actor.userId, input.id, "approve", null);
      if (!result.ok) throw new Error("Could not approve helper");
      return result.data.changed ? { approved: true } : { alreadyProcessed: true };
    },
  });
  if (!pipeline.ok) throw new Error(pipeline.stage === "rate_limit" ? "Please wait before trying this again." : "All approval checks are required");
  return pipeline.data;
}

export async function rejectHelper(id: string, reason?: string) {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction, botCheck: async () => true,
    validate: async () => { const parsed = HelperDecisionSchema.safeParse({ id, reason }); return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" }; },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (input, actor) => {
      const result = await reviewHelper(actor.userId, input.id, "decline", input.reason?.trim().slice(0, 1000) || null);
      if (!result.ok) throw new Error("Could not decline helper");
      return { declined: result.data.changed };
    },
  });
  if (!pipeline.ok) throw new Error(pipeline.stage === "rate_limit" ? "Please wait before trying this again." : "That helper decision is not valid.");
  return pipeline.data;
}

export async function suspendHelper(id: string, reason: string) {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction, botCheck: async () => true,
    validate: async () => { const parsed = HelperSuspensionSchema.safeParse({ id, reason }); return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" }; },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (input, actor) => {
      const result = await reviewHelper(actor.userId, input.id, "suspend", input.reason.trim().slice(0, 1000));
      if (!result.ok) throw new Error("Could not suspend helper");
      return { suspended: result.data.changed };
    },
  });
  if (!pipeline.ok) throw new Error(pipeline.stage === "rate_limit" ? "Please wait before trying this again." : "That helper decision is not valid.");
  return pipeline.data;
}

export async function getSignedDocumentUrl(documentId: string) {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction, botCheck: async () => true,
    validate: async () => { const parsed = HelperDocumentIdSchema.safeParse(documentId); return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" }; },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (id) => {
      const supabase = createSupabaseAdminClient();
      const { data: document, error } = await supabase.from("helper_private_docs").select("storage_path").eq("id", id).single();
      if (error || !document) throw new Error("Document unavailable");
      const { data, error: signedError } = await supabase.storage.from("helper-docs").createSignedUrl(document.storage_path, 60);
      if (signedError || !data) throw new Error("Document unavailable");
      return data.signedUrl;
    },
  });
  if (!pipeline.ok) throw new Error(pipeline.stage === "rate_limit" ? "Please wait before trying this again." : "Document unavailable");
  return pipeline.data;
}
