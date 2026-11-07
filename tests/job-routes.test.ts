import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  prototype: vi.fn(),
  rate: vi.fn(),
  processEmails: vi.fn(),
  reminders: vi.fn(),
}));

vi.mock("@/server/policies/prototype", () => ({ requirePrototypeRoutes: mocks.prototype }));
vi.mock("@/server/config/env", () => ({ env: { get MAINTENANCE_JOB_SECRET() { return process.env.MAINTENANCE_JOB_SECRET; } } }));
vi.mock("@/server/security/request-rate-limit", () => ({
  limitRequest: mocks.rate,
  retryAfterHeaders: () => ({ "Retry-After": "60" }),
}));
vi.mock("@/server/services/retention", () => ({
  processPendingEmails: mocks.processEmails,
  enqueueSubscriptionReminders: mocks.reminders,
}));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("server-only", () => ({}));

import { POST as emailOutboxPOST } from "@/app/api/jobs/email-outbox/route";
import { POST as remindersPOST } from "@/app/api/jobs/subscription-reminders/route";

function makeRequest(path: string, auth?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: auth ? { authorization: auth } : undefined,
  });
}

describe("email outbox job route", () => {
  beforeEach(() => {
    vi.stubEnv("MAINTENANCE_JOB_SECRET", "a-test-maintenance-secret-that-is-long-enough");
    mocks.prototype.mockReset();
    mocks.rate.mockReset().mockResolvedValue({ allowed: true });
    mocks.processEmails.mockReset().mockResolvedValue({ processed: 5, sent: 5, failed: 0 });
  });

  it("denies access with wrong secret", async () => {
    const res = await emailOutboxPOST(makeRequest("/api/jobs/email-outbox", "Bearer wrong-secret"));
    expect(res.status).toBe(403);
    expect(mocks.processEmails).not.toHaveBeenCalled();
  });

  it("runs email processing with valid bearer secret", async () => {
    const res = await emailOutboxPOST(makeRequest("/api/jobs/email-outbox", "Bearer a-test-maintenance-secret-that-is-long-enough"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      ok: true,
      data: { processed: 5, sent: 5, failed: 0 },
    });
    expect(mocks.processEmails).toHaveBeenCalled();
  });
});

describe("subscription reminders job route", () => {
  beforeEach(() => {
    vi.stubEnv("MAINTENANCE_JOB_SECRET", "a-test-maintenance-secret-that-is-long-enough");
    mocks.prototype.mockReset();
    mocks.rate.mockReset().mockResolvedValue({ allowed: true });
    mocks.reminders.mockReset().mockResolvedValue({ reminded: 3, failed: 0 });
  });

  it("denies access with missing secret", async () => {
    const res = await remindersPOST(makeRequest("/api/jobs/subscription-reminders"));
    expect(res.status).toBe(403);
    expect(mocks.reminders).not.toHaveBeenCalled();
  });

  it("runs subscription reminders with valid secret", async () => {
    const res = await remindersPOST(makeRequest("/api/jobs/subscription-reminders", "Bearer a-test-maintenance-secret-that-is-long-enough"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      ok: true,
      data: { reminded: 3, failed: 0 },
    });
    expect(mocks.reminders).toHaveBeenCalled();
  });
});

