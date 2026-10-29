import type { SupabaseClient } from "@supabase/supabase-js";

const RETENTION_PAGE_SIZE = 100;

export async function pruneExpiredRateLimitCounters(client: SupabaseClient, limit = 500): Promise<number> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error("Invalid rate-limit retention batch.");
  const { data, error } = await client.rpc("prune_expired_rate_limit_counters", { p_limit: limit });
  if (error || !Number.isInteger(data) || data < 0) throw new Error("Could not prune expired rate-limit counters.");
  return data;
}

export async function purgeExpiredHelperDocuments(client: SupabaseClient, now = new Date()): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  let lastId: string | null = null;
  const storage = client.storage.from("helper-docs");

  while (true) {
    let query = client.from("helper_private_docs")
      .select("id, storage_path")
      .lte("delete_after", now.toISOString())
      .order("id", { ascending: true })
      .limit(RETENTION_PAGE_SIZE);
    if (lastId) query = query.gt("id", lastId);
    const { data: documents, error } = await query;
    if (error) throw new Error("Could not load expired documents");
    if (!documents?.length) break;

    for (const document of documents) {
      try {
        const { error: storageError } = await storage.remove([document.storage_path]);
        if (storageError) {
          failed += 1;
          continue;
        }
        const { error: rowError } = await client.from("helper_private_docs").delete().eq("id", document.id);
        if (rowError) failed += 1;
        else deleted += 1;
      } catch {
        // Keep metadata so a later run can safely retry an uncertain operation.
        failed += 1;
      }
    }

    lastId = documents[documents.length - 1].id;
    if (documents.length < RETENTION_PAGE_SIZE) break;
  }
  return { deleted, failed };
}

export async function expireOpenBookings(client: SupabaseClient, now = new Date()): Promise<number> {
  const { data, error } = await client.rpc("expire_open_bookings", { p_now: now.toISOString() });
  if (error) throw new Error("Could not expire open bookings.");
  return typeof data === "number" ? data : 0;
}

export async function lapseExpiredSubscriptions(client: SupabaseClient, now = new Date()): Promise<number> {
  const { data, error } = await client.rpc("lapse_expired_subscriptions", { p_now: now.toISOString() });
  if (error) throw new Error("Could not lapse expired subscriptions.");
  return typeof data === "number" ? data : 0;
}

export async function pruneExpiredBookingOffers(client: SupabaseClient, now = new Date(), limit = 500): Promise<number> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 5000) throw new Error("Invalid offer-prune batch size.");
  const { data, error } = await client.rpc("prune_expired_booking_offers", { p_now: now.toISOString(), p_limit: limit });
  if (error) throw new Error("Could not prune expired booking offers.");
  return typeof data === "number" ? data : 0;
}

export async function autoReleaseBookings(client: SupabaseClient, now = new Date()): Promise<number> {
  const { data, error } = await client.rpc("auto_release_phase_a_bookings", { p_now: now.toISOString() });
  if (error) throw new Error("Could not auto-release bookings.");
  return typeof data === "number" ? data : 0;
}

export async function processPendingEmails(client: SupabaseClient, limit = 50): Promise<{ processed: number; sent: number; failed: number }> {
  const { processOutboxBatch } = await import("@/server/email/outbox");
  return processOutboxBatch(client, limit);
}
