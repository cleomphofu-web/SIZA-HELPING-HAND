import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  limitRequest: vi.fn(),
  requireActor: vi.fn(),
  sameOrigin: vi.fn(),
  createPhaseAReport: vi.fn(),
}));

vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limitRequest, retryAfterHeaders: vi.fn(() => ({ "Retry-After": "30" })) }));
vi.mock("@/server/http/pipeline-responses", () => ({ rateLimitResponse: () => NextResponse.json({ ok: false, error: { code: "rate_limited", message: "Please try again later." } }, { status: 429, headers: { "Retry-After": "30" } }) }));
vi.mock("@/server/policies/auth", () => ({ requireActor: mocks.requireActor }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/server/services/phase-a", () => ({ createPhaseAReport: mocks.createPhaseAReport }));
vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/reports/route";

const report = {
  idempotencyKey: "b53b38d5-cff4-4b87-a050-ed9fd1232430",
  bookingId: "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26",
  subjectId: null,
  category: "other",
  text: "The helper arrived late.",
};

function request(fields: Record<string, unknown>, json = true) {
  return new NextRequest("http://localhost:3000/api/reports", {
    method: "POST",
    headers: { origin: "http://localhost:3000", ...(json ? { "content-type": "application/json" } : {}) },
    body: json ? JSON.stringify(fields) : new URLSearchParams(Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, String(value ?? "")]))),
  });
}

describe("report API", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.limitRequest.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 30 });
    mocks.requireActor.mockReset().mockResolvedValue({ userId: "host-1", role: "host" });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.createPhaseAReport.mockReset().mockResolvedValue({ ok: true, data: { id: "report-1" } });
  });

  it("accepts JSON with a replay key and returns the created report envelope", async () => {
    const response = await POST(request(report));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, data: { id: "report-1" } });
    expect(mocks.createPhaseAReport).toHaveBeenCalledWith(expect.anything(), "host-1", report);
  });

  it("passes the same replay key through unchanged and returns the original result on a retry", async () => {
    const first = await POST(request(report));
    const replay = await POST(request(report));
    expect(first.status).toBe(201);
    expect(replay.status).toBe(201);
    await expect(replay.json()).resolves.toEqual({ ok: true, data: { id: "report-1" } });
    expect(mocks.createPhaseAReport).toHaveBeenNthCalledWith(1, expect.anything(), "host-1", report);
    expect(mocks.createPhaseAReport).toHaveBeenNthCalledWith(2, expect.anything(), "host-1", report);
  });

  it("keeps form submission compatible and validates the replay key", async () => {
    const fields = Object.fromEntries(Object.entries(report).map(([key, value]) => [key, String(value ?? "")]));
    const response = await POST(request(fields, false));
    expect(response.status).toBe(201);
    expect(mocks.createPhaseAReport).toHaveBeenCalledTimes(1);

    mocks.createPhaseAReport.mockClear();
    const invalid = await POST(request({ ...fields, idempotencyKey: "" }, false));
    expect(invalid.status).toBe(400);
    const missingBooking = await POST(request({ ...fields, bookingId: "" }, false));
    expect(missingBooking.status).toBe(400);
    expect(mocks.createPhaseAReport).not.toHaveBeenCalled();
  });

  it("does not call the service for wrong-origin or invalid-owner failures", async () => {
    mocks.sameOrigin.mockReturnValue(false);
    const wrongOrigin = await POST(request(report));
    expect(wrongOrigin.status).toBe(403);
    expect(mocks.createPhaseAReport).not.toHaveBeenCalled();

    mocks.sameOrigin.mockReturnValue(true);
    mocks.createPhaseAReport.mockResolvedValue({ ok: false, error: { code: "not_found", message: "We could not find that booking." } });
    const wrongOwner = await POST(request({ ...report, bookingId: "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26" }));
    expect(wrongOwner.status).toBe(404);

    mocks.createPhaseAReport.mockResolvedValue({ ok: false, error: { code: "forbidden", message: "You cannot send this report." } });
    const wrongRole = await POST(request(report));
    expect(wrongRole.status).toBe(403);
  });

  it("returns the shared rate-limit response before calling the service", async () => {
    mocks.limitRequest.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 });
    const response = await POST(request(report));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(mocks.createPhaseAReport).not.toHaveBeenCalled();
  });

  it("denies the mutation when prototype routes are disabled", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "false");
    await expect(POST(request(report))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(mocks.limitRequest).not.toHaveBeenCalled();
    expect(mocks.createPhaseAReport).not.toHaveBeenCalled();
  });
});
