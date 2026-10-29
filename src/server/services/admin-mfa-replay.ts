import "server-only";

import { createHmac } from "node:crypto";
import { env } from "@/server/config/env";
import { createSupabaseAdminClient } from "@/server/db/admin";

export function hashAdminMfaCode(factorId: string, code: string): string {
  return createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY)
    .update(`siza-admin-mfa-replay-v1\0${factorId}\0${code}`)
    .digest("hex");
}

/** Atomically reserves this code digest before Auth verification; failures deny the challenge. */
export async function reserveAdminMfaCode(factorId: string, code: string): Promise<boolean> {
  try {
    const client = createSupabaseAdminClient();
    const { data, error } = await client.rpc("reserve_admin_mfa_code", {
      p_factor_id: factorId,
      p_code_hash: hashAdminMfaCode(factorId, code),
    });
    return !error && data === true;
  } catch {
    return false;
  }
}
