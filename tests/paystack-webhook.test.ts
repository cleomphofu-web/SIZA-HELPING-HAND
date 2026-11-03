import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { processPaymentWebhook } from "@/server/services/payment-webhook";
import { signMockWebhook } from "@/server/payments/mock";
import { resetPaymentProvider } from "@/server/payments";

describe("Paystack Webhook Handler", () => {
  beforeEach(() => {
    resetPaymentProvider();
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.PAYSTACK_WEBHOOK_SECRET;
  });

  function makeMockDb(options: {
    existingPayment?: { id: string; status: string; booking_id: string; amount_cents: string } | null;
    booking?: {
      id: string;
      pay_per_helper_cents: string;
      transport_per_helper_cents: string;
      helpers_needed: number;
      service_fee_cents: string;
    } | null;
  }) {
    const insertedPayments: Array<Record<string, unknown>> = [];
    const updatedPayments: Array<Record<string, unknown>> = [];
    const insertedLedger: Array<Record<string, unknown>> = [];

    const db = {
      from: vi.fn((table: string) => {
        if (table === "payments") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: options.existingPayment ?? null,
                  error: null,
                }),
              }),
            }),
            insert: (data: Record<string, unknown>) => {
              insertedPayments.push(data);
              return {
                select: () => ({
                  single: async () => ({
                    data: { id: "payment-new-123", ...data },
                    error: null,
                  }),
                }),
              };
            },
            update: (data: Record<string, unknown>) => {
              updatedPayments.push(data);
              return {
                eq: async () => ({ error: null }),
              };
            },
          };
        }

        if (table === "phase_a_bookings") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: options.booking ?? null,
                  error: options.booking ? null : { message: "Not found" },
                }),
              }),
            }),
          };
        }

        if (table === "ledger_entries") {
          return {
            insert: (data: Array<Record<string, unknown>>) => {
              insertedLedger.push(...data);
              return {
                select: async () => ({
                  data: data.map((d, i) => ({ id: `ledger-${i}`, ...d })),
                  error: null,
                }),
              };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      _insertedPayments: insertedPayments,
      _updatedPayments: updatedPayments,
      _insertedLedger: insertedLedger,
    };

    return db;
  }

  it("rejects webhook with invalid signature", async () => {
    const db = makeMockDb({});
    const payload = JSON.stringify({ event: "charge.success" });
    const headers = new Headers({ "x-paystack-signature": "invalid-sig" });

    const result = await processPaymentWebhook(db, payload, headers);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation_failed");
    }
  });

  it("processes charge.success and writes balanced ledger rows", async () => {
    // 1 helper: pay 24000 + transport 5000 = 29000 helper payable
    // Service fee: 7000 cents
    // Total: 36000 cents
    const db = makeMockDb({
      booking: {
        id: "booking-001",
        pay_per_helper_cents: "24000",
        transport_per_helper_cents: "5000",
        helpers_needed: 1,
        service_fee_cents: "7000",
      },
    });

    const payload = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "ref-success-123",
        amount: 36000,
        currency: "ZAR",
        metadata: { booking_id: "booking-001" },
      },
    });

    const signature = signMockWebhook(payload);
    const headers = new Headers({ "x-paystack-signature": signature });

    const result = await processPaymentWebhook(db, payload, headers);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.processed).toBe(true);
      expect(result.data.duplicate).toBe(false);
    }

    // Assert 3 ledger entries were recorded: host_payment, platform_fee, helper_payable
    expect(db._insertedLedger).toHaveLength(3);
    const kinds = db._insertedLedger.map((e) => e.kind);
    expect(kinds).toContain("host_payment");
    expect(kinds).toContain("platform_fee");
    expect(kinds).toContain("helper_payable");

    // Check amounts
    const hostPayment = db._insertedLedger.find((e) => e.kind === "host_payment");
    const platformFee = db._insertedLedger.find((e) => e.kind === "platform_fee");
    const helperPayable = db._insertedLedger.find((e) => e.kind === "helper_payable");

    expect(hostPayment?.amount_cents).toBe("36000");
    expect(platformFee?.amount_cents).toBe("7000");
    expect(helperPayable?.amount_cents).toBe("29000");
  });

  it("handles duplicate webhook replay idempotently", async () => {
    const db = makeMockDb({
      existingPayment: {
        id: "payment-already-paid",
        status: "paid",
        booking_id: "booking-001",
        amount_cents: "36000",
      },
    });

    const payload = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "ref-already-done",
        amount: 36000,
        currency: "ZAR",
        metadata: { booking_id: "booking-001" },
      },
    });

    const signature = signMockWebhook(payload);
    const headers = new Headers({ "x-paystack-signature": signature });

    const result = await processPaymentWebhook(db, payload, headers);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.processed).toBe(true);
      expect(result.data.duplicate).toBe(true);
      expect(result.data.paymentId).toBe("payment-already-paid");
    }

    // No new ledger entries written on replay
    expect(db._insertedLedger).toHaveLength(0);
  });

  it("rejects payment when amount does not match booking expected total", async () => {
    const db = makeMockDb({
      booking: {
        id: "booking-001",
        pay_per_helper_cents: "24000",
        transport_per_helper_cents: "5000",
        helpers_needed: 1,
        service_fee_cents: "7000",
      },
    });

    // Send 20000 instead of 36000
    const payload = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "ref-underpaid",
        amount: 20000,
        currency: "ZAR",
        metadata: { booking_id: "booking-001" },
      },
    });

    const signature = signMockWebhook(payload);
    const headers = new Headers({ "x-paystack-signature": signature });

    const result = await processPaymentWebhook(db, payload, headers);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.message).toContain("amount mismatch");
    }
  });

  it("updates payment status to failed on charge.failed event", async () => {
    const db = makeMockDb({});

    const payload = JSON.stringify({
      event: "charge.failed",
      data: {
        reference: "ref-failed-123",
        amount: 36000,
        currency: "ZAR",
        metadata: { booking_id: "booking-001" },
      },
    });

    const signature = signMockWebhook(payload);
    const headers = new Headers({ "x-paystack-signature": signature });

    const result = await processPaymentWebhook(db, payload, headers);
    expect(result.ok).toBe(true);
    expect(db._updatedPayments).toHaveLength(1);
    expect(db._updatedPayments[0]?.status).toBe("failed");
  });
});
