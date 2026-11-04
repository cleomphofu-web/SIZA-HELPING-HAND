import "server-only";

import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireAdmin } from "@/server/policies/auth";

export interface LedgerEntryView {
  id: string;
  bookingId: string;
  kind: string;
  amountCents: bigint;
  description: string;
  ref: string | null;
  createdAt: string;
}

export async function getAdminLedgerEntries(
  limit = 50,
): Promise<Result<LedgerEntryView[]>> {
  await requireAdmin();

  const adminDb = createSupabaseAdminClient();
  const { data, error } = await adminDb
    .from("ledger_entries")
    .select("id, booking_id, kind, amount_cents, description, ref, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return fail("internal_error", "Failed to load ledger entries");
  }

  return ok(
    (data ?? []).map((row) => ({
      id: row.id as string,
      bookingId: row.booking_id as string,
      kind: row.kind as string,
      amountCents: BigInt(row.amount_cents as string),
      description: row.description as string,
      ref: row.ref as string | null,
      createdAt: row.created_at as string,
    })),
  );
}

