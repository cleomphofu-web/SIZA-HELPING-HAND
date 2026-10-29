import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({ env: {
  RESEND_API_KEY: "test-only-key",
  RESEND_FROM_EMAIL: "SIZA <test@example.test>",
  ADMIN_NOTIFY_EMAIL: "admin@example.test",
} }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));

import {
  notifyAdminNewApplication,
  notifyAdminNewBooking,
  notifyHelperJobAssigned,
  notifyHostBookingAssigned,
  notifyHostBookingRequested,
  notifyHostNoHelper,
  sendHelperApproved,
  sendHelperRejected,
} from "@/server/email/notifications";

const helperId = "00000000-0000-4000-8000-000000000001";
const bookingId = "00000000-0000-4000-8000-000000000002";
const key = (event: string, id: string) => `siza:${event}:${createHash("sha256").update(`${event}:${id}`).digest("hex")}`;

describe("transactional email boundary", () => {
  beforeEach(() => mocks.send.mockReset().mockResolvedValue({ error: null }));

  it("uses generated approved-helper copy and a stable provider idempotency key", async () => {
    await sendHelperApproved("helper@example.test", "Nandi", helperId);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      from: "SIZA <test@example.test>",
      to: "helper@example.test",
      subject: "You are approved",
      text: expect.stringContaining("Your first completed job is free."),
    }), { idempotencyKey: key("helper-approved", helperId) });
  });

  it("uses generic decline copy and never includes a free-text reason", async () => {
    await sendHelperRejected("helper@example.test", "Nandi", helperId);
    const [message] = mocks.send.mock.calls[0];
    expect(message.subject).toBe("About your application");
    expect(message.text).toContain("Please check your account for an update.");
    expect(message.text).not.toContain(helperId);
    expect(mocks.send.mock.calls[0][1]).toEqual({ idempotencyKey: key("helper-declined", helperId) });
  });

  it("keeps booking and application UUIDs out of admin email content", async () => {
    await notifyAdminNewBooking(bookingId);
    await notifyAdminNewApplication(helperId);
    const bodies = mocks.send.mock.calls.map(([message]) => `${message.subject}\n${message.text}`);
    expect(bodies.join("\n")).not.toContain(bookingId);
    expect(bodies.join("\n")).not.toContain(helperId);
    expect(bodies[0]).toContain("A new request is waiting in the admin area.");
    expect(bodies[1]).toContain("A helper application is ready for review in the admin area.");
    expect(mocks.send.mock.calls.map(([, options]) => options.idempotencyKey)).toEqual([
      key("admin-new-request", bookingId),
      key("admin-new-application", helperId),
    ]);
  });

  it("builds host request and assignment messages from generated copy with local time", async () => {
    const startAt = new Date("2026-10-26T08:00:00.000Z");
    await notifyHostBookingRequested("host@example.test", "Mina", "Home cleaning", startAt, bookingId);
    await notifyHostBookingAssigned("host@example.test", "Mina", "Nandi", "Home cleaning", startAt, "123456", bookingId);
    const requested = mocks.send.mock.calls[0][0];
    const assigned = mocks.send.mock.calls[1][0];
    expect(requested.subject).toBe("We got your request");
    expect(requested.text).toContain("Home cleaning");
    expect(requested.text).toContain("10:00");
    expect(assigned.subject).toBe("Your helper is confirmed: Nandi");
    expect(assigned.text).toContain("Your check-in code is 123456.");
    expect(mocks.send.mock.calls[1][1].idempotencyKey).toBe(key("host-booking-assigned", bookingId));
  });

  it("keeps helper assignment email free of addresses, check-in codes, and database identifiers", async () => {
    const assignmentId = "00000000-0000-4000-8000-000000000003";
    await notifyHelperJobAssigned("helper@example.test", "Nandi", new Date("2026-10-26T08:00:00.000Z"), assignmentId);
    await notifyHostNoHelper("host@example.test", "Mina", bookingId);
    const helperEmail = mocks.send.mock.calls[0][0];
    expect(helperEmail.text).toContain("The address and the host's contact details are in your app.");
    expect(helperEmail.text).not.toContain(assignmentId);
    expect(helperEmail.text).not.toContain("123456");
    expect(mocks.send.mock.calls[0][1].idempotencyKey).toBe(key("helper-job-assigned", assignmentId));
    expect(mocks.send.mock.calls[1][0].text).toContain("nobody has accepted your request yet");
  });

  it("rejects malformed event identifiers before contacting Resend", async () => {
    await expect(notifyAdminNewBooking("not-a-uuid")).rejects.toThrow("Email notification could not be prepared");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects an invalid check-in code before contacting Resend", async () => {
    await expect(notifyHostBookingAssigned("host@example.test", "Mina", "Nandi", "Home cleaning", new Date(), "12345", bookingId)).rejects.toThrow("Email notification could not be prepared");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("hides provider error details from callers", async () => {
    mocks.send.mockResolvedValue({ error: { message: "private provider response" } });
    await expect(notifyAdminNewBooking(bookingId)).rejects.toThrow("Email delivery failed");
    expect(mocks.send.mock.results).toHaveLength(1);
  });
});
