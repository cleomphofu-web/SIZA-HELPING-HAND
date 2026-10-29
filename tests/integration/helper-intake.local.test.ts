import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_LOCAL_SUPABASE_RLS_TESTS === "true";
const integration = enabled ? describe : describe.skip;
type Disposable = { id: string; email: string; password: string };
let service: SupabaseClient;
let helperClient: SupabaseClient;
const identities: Disposable[] = [];
let helper: Disposable;
let admin: Disposable;

function localConfig() {
  const url = process.env.LOCAL_SUPABASE_URL;
  const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Set explicit local Supabase test connection values.");
  if (!(new URL(url).hostname === "localhost" || new URL(url).hostname === "127.0.0.1" || new URL(url).hostname === "::1")) {
    throw new Error("Refusing helper intake integration setup: local Supabase URL must resolve to loopback.");
  }
  return { url, anonKey, serviceRoleKey };
}

async function createIdentity(role: "helper" | "admin", anonKey: string, url: string): Promise<Disposable> {
  const identity = {
    id: "",
    email: `siza-helper-intake-${role}-${crypto.randomUUID()}@example.test`,
    password: `${crypto.randomUUID()}-Synthetic!`,
  };
  const { data, error } = await service.auth.admin.createUser({ email: identity.email, password: identity.password, email_confirm: true });
  if (error || !data.user) throw new Error("Could not create disposable local helper intake identity.");
  identity.id = data.user.id;
  identities.push(identity);
  const phone = `+2782${Array.from(crypto.getRandomValues(new Uint8Array(7)), (value) => value % 10).join("")}`;
  const { error: profileError } = await service.from("profiles").insert({
    id: identity.id,
    role,
    first_name: role === "helper" ? "Test Helper" : "Test Admin",
    phone,
    terms_version: "local-test",
    terms_accepted_at: new Date().toISOString(),
    privacy_version: "local-test",
    privacy_accepted_at: new Date().toISOString(),
  });
  if (profileError) throw new Error("Could not seed disposable local helper intake profile.");
  if (role === "admin") {
    const { error: adminError } = await service.from("admins").insert({ user_id: identity.id });
    if (adminError) throw new Error("Could not seed disposable local admin membership.");
  }
  if (role === "helper") {
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: signInError } = await client.auth.signInWithPassword({ email: identity.email, password: identity.password });
    if (signInError) throw new Error("Could not authenticate disposable local helper.");
    helperClient = client;
  }
  return identity;
}

integration("helper intake atomicity against an explicitly selected local Supabase stack", () => {
  beforeAll(async () => {
    const config = localConfig();
    service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    helper = await createIdentity("helper", config.anonKey, config.url);
    admin = await createIdentity("admin", config.anonKey, config.url);
  }, 30_000);

  afterAll(async () => {
    for (const identity of identities) await service.auth.admin.deleteUser(identity.id);
    await helperClient?.auth.signOut();
  }, 30_000);

  it("checks caller role and storage scope, inserts all rows once, and starts retention at the decision", async () => {
    const makePaths = () => ({
      idPhoto: `${helper.id}/${crypto.randomUUID()}.jpg`,
      selfie: `${helper.id}/${crypto.randomUUID()}.webp`,
    });
    const base = {
      p_helper_id: helper.id,
      p_date_of_birth: "1990-01-01",
      p_job_title: "Home helper",
      p_services: ["home_cleaning"],
      p_suburbs: ["Rosebank"],
      p_bio: "Synthetic application",
      p_experience_note: "",
      p_rate_note: "",
      p_id_number_encrypted: "synthetic-encrypted-id",
      p_id_hash: `synthetic-${crypto.randomUUID()}`,
    };

    const invalidPath = await service.rpc("create_helper_application", {
      ...base,
      ...Object.fromEntries(Object.entries(makePaths()).map(([key, path]) => [key === "idPhoto" ? "p_id_photo_path" : "p_selfie_check_path", `other-helper/${path.split("/")[1]}`])),
    });
    expect(invalidPath.error).toBeTruthy();
    const denied = await helperClient.rpc("create_helper_application", { ...base, ...Object.fromEntries(Object.entries(makePaths()).map(([key, path]) => [key === "idPhoto" ? "p_id_photo_path" : "p_selfie_check_path", path])) });
    expect(denied.error?.code).toBe("42501");
    const { data: absentBefore, error: absentBeforeError } = await service.from("helper_details").select("user_id").eq("user_id", helper.id).maybeSingle();
    expect(absentBeforeError).toBeNull();
    expect(absentBefore).toBeNull();

    const { error: wrongRoleSeedError } = await service.from("profiles").update({ role: "host" }).eq("id", helper.id);
    expect(wrongRoleSeedError).toBeNull();
    const wrongPersistedRole = await service.rpc("create_helper_application", {
      ...base,
      ...Object.fromEntries(Object.entries(makePaths()).map(([key, path]) => [key === "idPhoto" ? "p_id_photo_path" : "p_selfie_check_path", path])),
    });
    expect(wrongPersistedRole.error?.code).toBe("42501");
    const { error: restoreRoleError } = await service.from("profiles").update({ role: "helper" }).eq("id", helper.id);
    expect(restoreRoleError).toBeNull();

    const paths = makePaths();
    const first = await service.rpc("create_helper_application", {
      ...base,
      p_id_photo_path: paths.idPhoto,
      p_selfie_check_path: paths.selfie,
    });
    expect(first.error).toBeNull();
    const { data: details, error: detailsError } = await service.from("helper_details").select("status, job_title, id_number_encrypted").eq("user_id", helper.id).single();
    const { data: docs, error: docsError } = await service.from("helper_private_docs").select("type, storage_path, delete_after").eq("helper_id", helper.id);
    expect(detailsError).toBeNull();
    expect(docsError).toBeNull();
    expect(details).toMatchObject({ status: "pending", job_title: "Home helper", id_number_encrypted: "synthetic-encrypted-id" });
    expect(docs).toHaveLength(2);
    expect(docs?.every((document) => document.delete_after === null)).toBe(true);

    const duplicate = await service.rpc("create_helper_application", {
      ...base,
      p_job_title: "Overwritten title",
      p_id_photo_path: `${helper.id}/${crypto.randomUUID()}.jpg`,
      p_selfie_check_path: `${helper.id}/${crypto.randomUUID()}.jpg`,
    });
    expect(duplicate.error?.code).toBe("23505");
    const { data: unchanged } = await service.from("helper_details").select("status, job_title").eq("user_id", helper.id).single();
    const { data: unchangedDocs } = await service.from("helper_private_docs").select("id").eq("helper_id", helper.id);
    expect(unchanged).toMatchObject({ status: "pending", job_title: "Home helper" });
    expect(unchangedDocs).toHaveLength(2);

    const decisionStart = Date.now();
    const review = await service.rpc("admin_review_helper", { p_actor_id: admin.id, p_helper_id: helper.id, p_action: "approve", p_reason: null });
    expect(review.error).toBeNull();
    expect(review.data).toBe(true);
    const { data: reviewed } = await service.from("helper_details").select("status, id_number_encrypted, check_notes_private").eq("user_id", helper.id).single();
    const { data: retainedDocs } = await service.from("helper_private_docs").select("delete_after").eq("helper_id", helper.id);
    const expiresAt = Date.parse(retainedDocs?.[0]?.delete_after ?? "");
    expect(reviewed).toMatchObject({ status: "approved", id_number_encrypted: null, check_notes_private: null });
    expect(retainedDocs).toHaveLength(2);
    expect(Number.isFinite(expiresAt)).toBe(true);
    expect(expiresAt).toBeGreaterThanOrEqual(decisionStart + 29 * 24 * 60 * 60_000);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + 31 * 24 * 60 * 60_000);
  });
});
