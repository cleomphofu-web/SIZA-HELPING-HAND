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
  let aboutToExpire: Array<{ id: string; host_id: string }> = [];
  if (typeof client.from === "function") {
    try {
      const { data } = await client.from("phase_a_bookings").select("id, host_id").eq("status", "open");
      aboutToExpire = data ?? [];
    } catch {
      // Non-blocking
    }
  }

  const { data, error } = await client.rpc("expire_open_bookings", { p_now: now.toISOString() });
  if (error) throw new Error("Could not expire open bookings.");
  const count = typeof data === "number" ? data : 0;

  if (count > 0 && aboutToExpire.length && typeof client.from === "function") {
    try {
      const { data: expiredList } = await client
        .from("phase_a_bookings")
        .select("id, host_id")
        .in("id", aboutToExpire.map((b) => b.id))
        .eq("status", "expired");

      if (expiredList?.length) {
        const { enqueueEmail } = await import("@/server/email/outbox");
        const { createNotification } = await import("@/server/services/notifications");

        for (const booking of expiredList) {
          let hostEmail: string | null = null;
          if (client.auth?.admin?.getUserById) {
            const { data: u } = await client.auth.admin.getUserById(booking.host_id);
            hostEmail = u?.user?.email ?? null;
          }
          const { data: hostProfile } = await client.from("profiles").select("first_name").eq("id", booking.host_id).maybeSingle();
          const firstName = hostProfile?.first_name || "Host";

          if (hostEmail) {
            await enqueueEmail(client, {
              eventType: "host-no-helper",
              recipient: hostEmail,
              entityId: booking.id,
              variables: { firstName },
            });
          }

          await createNotification({
            userId: booking.host_id,
            kind: "booking_cancelled",
            title: "No helper accepted yet",
            body: "Nobody has accepted your request yet. You can raise the pay, change the time, or try again later.",
            actionPath: `/app/requests/${booking.id}`,
            referenceId: booking.id,
          });
        }
      }
    } catch {
      // Non-blocking notification
    }
  }

  return count;
}

export async function lapseExpiredSubscriptions(client: SupabaseClient, now = new Date()): Promise<number> {
  const { data, error } = await client.rpc("lapse_expired_subscriptions", { p_now: now.toISOString() });
  if (error) throw new Error("Could not lapse expired subscriptions.");
  return typeof data === "number" ? data : 0;
}

export async function enqueueSubscriptionReminders(
  client: SupabaseClient,
  now = new Date(),
  daysAhead = 7,
): Promise<{ reminded: number; failed: number }> {
  let reminded = 0;
  let failed = 0;

  if (typeof client.from !== "function") {
    return { reminded: 0, failed: 0 };
  }

  try {
    const reminderThreshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    const { data: helpers, error } = await client
      .from("helper_details")
      .select("user_id, subscription_paid_until")
      .eq("status", "approved")
      .eq("subscription_status", "active")
      .not("first_job_completed_at", "is", null)
      .not("subscription_paid_until", "is", null)
      .gt("subscription_paid_until", now.toISOString())
      .lte("subscription_paid_until", reminderThreshold);

    if (error || !helpers?.length) return { reminded: 0, failed: 0 };

    const { enqueueEmail } = await import("@/server/email/outbox");
    const { createNotification } = await import("@/server/services/notifications");

    for (const helper of helpers) {
      try {
        let helperEmail: string | null = null;
        if (client.auth?.admin?.getUserById) {
          const { data: u } = await client.auth.admin.getUserById(helper.user_id);
          helperEmail = u?.user?.email ?? null;
        }

        const { data: profile } = await client
          .from("profiles")
          .select("first_name")
          .eq("id", helper.user_id)
          .maybeSingle();

        const firstName = profile?.first_name || "Helper";
        const paidUntilDate = new Date(helper.subscription_paid_until);
        const formattedDate = paidUntilDate.toLocaleDateString("en-ZA", {
          timeZone: "Africa/Johannesburg",
          dateStyle: "medium",
        });
        const reference = `SUB-${helper.user_id.slice(0, 8).toUpperCase()}`;

        if (helperEmail) {
          const { enqueued } = await enqueueEmail(client, {
            eventType: "helper-plan-reminder",
            recipient: helperEmail,
            entityId: helper.user_id,
            variables: {
              firstName,
              date: formattedDate,
              subscriptionPrice: "120",
              reference,
            },
          });
          if (enqueued) reminded += 1;
        }

        await createNotification({
          userId: helper.user_id,
          kind: "subscription_reminder",
          title: "Your siZa plan ends soon",
          body: `Your plan ends on ${formattedDate}. Pay R120 to keep seeing new jobs.`,
          actionPath: "/helper/account",
          referenceId: helper.user_id,
        });
      } catch {
        failed += 1;
      }
    }
  } catch {
    // Non-blocking
  }

  return { reminded, failed };
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
