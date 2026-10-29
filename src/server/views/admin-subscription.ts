import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireAdmin } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";

export type AdminSubscriptionRecord = {
  id: string;
  helperId: string;
  helperName: string;
  amountCents: number;
  periodMonths: number;
  reference: string;
  paidUntilAfter: string;
  createdAt: string;
};

type PaymentRow = {
  id: string;
  helper_id: string;
  amount_cents: number | string;
  period_months: number;
  reference: string;
  paid_until_after: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string | null;
  } | null;
};

export async function getAdminSubscriptionPayments(): Promise<Result<AdminSubscriptionRecord[]>> {
  await requireAdmin();

  try {
    const client = createSupabaseAdminClient();
    const { data, error } = await client
      .from("phase_a_subscription_payments")
      .select("id, helper_id, amount_cents, period_months, reference, paid_until_after, created_at, profiles:helper_id(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return fail("internal_error", "Failed to load subscription payments.");
    }

    const rows = data as unknown as PaymentRow[];
    const records: AdminSubscriptionRecord[] = rows.map((row) => ({
      id: row.id,
      helperId: row.helper_id,
      helperName: row.profiles ? `${row.profiles.first_name} ${row.profiles.last_name || ""}`.trim() : "Helper",
      amountCents: Number(row.amount_cents),
      periodMonths: row.period_months,
      reference: row.reference,
      paidUntilAfter: row.paid_until_after,
      createdAt: row.created_at,
    }));

    return ok(records);
  } catch {
    return fail("internal_error", "Failed to load subscription payments.");
  }
}
