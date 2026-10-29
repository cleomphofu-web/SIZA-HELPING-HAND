import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/server/db/server";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { adminSessionRequiresMfa } from "@/server/services/admin-mfa";

export type AuthenticatedActor = { id: string; userId: string; role: "host" | "helper" | "admin" };

export async function requireActor(): Promise<AuthenticatedActor> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthenticated");
  const { data: profile, error } = await supabase.from("profiles").select("role, deleted_at").eq("id", user.id).maybeSingle();
  if (error || !profile || profile.deleted_at !== null) throw new Error("unauthenticated");
  if (profile.role === "admin") {
    const { data: membership, error: membershipError } = await createSupabaseAdminClient()
      .from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (membershipError || !membership) throw new Error("unauthenticated");
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || adminSessionRequiresMfa(assurance?.currentLevel ?? null)) throw new Error("admin_mfa_required");
  }
  return { id: user.id, userId: user.id, role: profile.role as AuthenticatedActor["role"] };
}

export async function requireAdminIdentity() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const adminClient = createSupabaseAdminClient();
  const [{ data: profile, error: profileError }, { data: admin, error: adminError }] = await Promise.all([
    adminClient.from("profiles").select("role, deleted_at").eq("id", user.id).maybeSingle(),
    adminClient.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || adminError || profile?.role !== "admin" || profile.deleted_at !== null || !admin) redirect("/admin/login?error=unauthorised");
  return { userId: user.id, supabase };
}

export async function requireAdmin() {
  const identity = await requireAdminIdentity();
  const { data: assurance, error } = await identity.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || adminSessionRequiresMfa(assurance?.currentLevel ?? null)) redirect("/admin/mfa?challenge=1");
  return { userId: identity.userId };
}
