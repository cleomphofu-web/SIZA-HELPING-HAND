import { createSupabaseAdminClient } from "@/server/db/admin";
import type { accountEntrySchema } from "@/lib/schemas";
import type { z } from "zod";
import { normaliseSaPhone } from "@/lib/schemas";
import { fail, ok, type Result } from "@/server/services/result";

type AccountInput = z.infer<typeof accountEntrySchema>;

export type CreateAccountOptions = {
  emailRedirectTo?: string;
};

export async function createAccount(
  input: AccountInput,
  authClient: {
    auth: {
      signUp: (options: {
        email: string;
        password: string;
        options?: {
          emailRedirectTo?: string;
          data?: Record<string, unknown>;
        };
      }) => Promise<{
        data: { user: { id: string } | null };
        error: { message: string } | null;
      }>;
    };
  },
  options?: CreateAccountOptions
): Promise<Result<{ userId: string }>> {
  const phone = normaliseSaPhone(input.phone);
  if (!phone) return fail("validation_failed", "Enter a valid South African phone number.");
  const { data, error } = await authClient.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      ...(options?.emailRedirectTo ? { emailRedirectTo: options.emailRedirectTo } : {}),
      data: {
        role: input.role,
        first_name: input.firstName,
        last_name: input.lastName,
      },
    },
  });
  if (error || !data.user) return fail("conflict", "We could not create this account. Check your details and try again.");
  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role: input.role,
    first_name: input.firstName,
    last_name: input.lastName,
    phone,
    terms_version: input.termsVersion,
    terms_accepted_at: new Date().toISOString(),
    privacy_version: input.privacyVersion,
    privacy_accepted_at: new Date().toISOString(),
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return fail("conflict", "We could not create this account. Check your details and try again.");
  }
  return ok({ userId: data.user.id });
}
