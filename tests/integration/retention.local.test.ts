import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { purgeExpiredHelperDocuments } from "@/server/services/retention";

vi.mock("server-only", () => ({}));

const enabled = process.env.RUN_LOCAL_SUPABASE_RLS_TESTS === "true";
const integration = enabled ? describe : describe.skip;
let service: SupabaseClient;
let helperId = "";
let objectPath = "";

function localConfig() {
  const url = process.env.LOCAL_SUPABASE_URL;
  const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Set explicit local Supabase test connection values.");
  if (!(new URL(url).hostname === "localhost" || new URL(url).hostname === "127.0.0.1" || new URL(url).hostname === "::1")) {
    throw new Error("Refusing retention integration setup: Supabase URL must resolve to loopback.");
  }
  return { url, anonKey, serviceRoleKey };
}

integration("helper document retention against an explicitly selected local Supabase stack", () => {
  beforeAll(async () => {
    const config = localConfig();
    service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  });

  afterAll(async () => {
    if (!service) return;
    if (objectPath) await service.storage.from("helper-docs").remove([objectPath]);
    if (helperId) {
      const { error: documentError } = await service.from("helper_private_docs").delete().eq("helper_id", helperId);
      const { error: identityError } = await service.auth.admin.deleteUser(helperId);
      expect(documentError).toBeNull();
      expect(identityError).toBeNull();
    }
  });

  it("removes expired private objects before deleting their metadata and is safe to retry", async () => {
    const now = new Date();
    const { data: existingExpired, error: existingError } = await service.from("helper_private_docs")
      .select("id")
      .lte("delete_after", now.toISOString())
      .limit(1);
    expect(existingError).toBeNull();
    if (existingExpired?.length) throw new Error("Local retention integration requires an empty expired-document queue.");

    const email = `siza-retention-${crypto.randomUUID()}@example.test`;
    const { data: userData, error: userError } = await service.auth.admin.createUser({ email, password: `${crypto.randomUUID()}-Test-only!`, email_confirm: true });
    expect(userError).toBeNull();
    if (!userData.user) throw new Error("Could not create disposable local retention identity.");
    helperId = userData.user.id;
    const phone = `+2782${Array.from(crypto.getRandomValues(new Uint8Array(7)), (digit) => String(digit % 10)).join("")}`;
    const { error: profileError } = await service.from("profiles").insert({
      id: helperId,
      role: "helper",
      first_name: "Retention Test",
      phone,
      terms_version: "local-test",
      terms_accepted_at: now.toISOString(),
      privacy_version: "local-test",
      privacy_accepted_at: now.toISOString(),
    });
    expect(profileError).toBeNull();

    objectPath = `${helperId}/${crypto.randomUUID()}.jpg`;
    const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "blue" } }).jpeg().toBuffer();
    const { error: uploadError } = await service.storage.from("helper-docs").upload(objectPath, image, { contentType: "image/jpeg", upsert: false });
    expect(uploadError).toBeNull();
    const { error: documentError } = await service.from("helper_private_docs").insert({
      helper_id: helperId,
      type: "id_photo",
      storage_path: objectPath,
      delete_after: new Date(now.getTime() - 60_000).toISOString(),
    });
    expect(documentError).toBeNull();

    const result = await purgeExpiredHelperDocuments(service, now);
    expect(result).toEqual({ deleted: 1, failed: 0 });
    const { data: remaining, error: remainingError } = await service.from("helper_private_docs").select("id").eq("helper_id", helperId);
    expect(remainingError).toBeNull();
    expect(remaining).toEqual([]);
    const { data: objects, error: listError } = await service.storage.from("helper-docs").list(helperId, { limit: 100 });
    expect(listError).toBeNull();
    expect(objects?.some((object) => object.name === objectPath.split("/").at(-1))).toBe(false);
    const { error: repeatedRemovalError } = await service.storage.from("helper-docs").remove([objectPath]);
    expect(repeatedRemovalError).toBeNull();
    objectPath = "";

    const replay = await purgeExpiredHelperDocuments(service, now);
    expect(replay).toEqual({ deleted: 0, failed: 0 });
  }, 30_000);
});
