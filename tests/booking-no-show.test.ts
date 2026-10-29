import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({ env: { ID_ENCRYPTION_KEY: "test-key" } }));

import { handlePhaseANoShow, resolvePhaseANoShowSlot } from "@/server/services/phase-a";

const client = { rpc: mocks.rpc } as unknown as SupabaseClient;
const input = { bookingId: "10000000-0000-4000-8000-000000000001", helperId: "20000000-0000-4000-8000-000000000002" };

describe("atomic helper no-show service", () => {
  beforeEach(() => mocks.rpc.mockReset());

  it("records one host-owned no-show through the database transaction", async () => {
    mocks.rpc.mockResolvedValue({ data: "30000000-0000-4000-8000-000000000003", error: null });

    const result = await handlePhaseANoShow(client, "40000000-0000-4000-8000-000000000004", input);

    expect(mocks.rpc).toHaveBeenCalledWith("record_phase_a_helper_no_show_with_assignment_state", {
      p_host_id: "40000000-0000-4000-8000-000000000004",
      p_booking_id: input.bookingId,
      p_helper_id: input.helperId,
    });
    expect(result).toEqual({ ok: true, data: { reopened: true } });
  });

  it.each([
    ["P0002", "not_found"],
    ["42501", "forbidden"],
    ["P0001", "conflict"],
  ])("maps database denial %s to %s without exposing database details", async (code, expected) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "private database detail" } });

    const result = await handlePhaseANoShow(client, "40000000-0000-4000-8000-000000000004", input);

    expect(result).toMatchObject({ ok: false, error: { code: expected } });
    expect(JSON.stringify(result)).not.toContain("private database detail");
  });

  it("returns a generic failure when the transaction cannot be confirmed", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "private database detail" } });

    const result = await handlePhaseANoShow(client, "40000000-0000-4000-8000-000000000004", input);

    expect(result).toMatchObject({ ok: false, error: { code: "internal_error" } });
    expect(JSON.stringify(result)).not.toContain("private database detail");
  });
});

describe("atomic host no-show resolution service", () => {
  beforeEach(() => mocks.rpc.mockReset());

  it("records the host's choice to close only the vacant slot", async () => {
    const choice = { bookingId: input.bookingId, slot: 2, resolution: "close_vacant_slot" as const };
    mocks.rpc.mockResolvedValue({ data: "30000000-0000-4000-8000-000000000003", error: null });

    const result = await resolvePhaseANoShowSlot(client, "40000000-0000-4000-8000-000000000004", choice);

    expect(mocks.rpc).toHaveBeenCalledWith("resolve_phase_a_no_show_slot", {
      p_host_id: "40000000-0000-4000-8000-000000000004",
      p_booking_id: choice.bookingId,
      p_slot: choice.slot,
      p_resolution: choice.resolution,
    });
    expect(result).toEqual({ ok: true, data: { closed: true } });
  });

  it.each([["P0002", "not_found"], ["42501", "forbidden"], ["P0001", "conflict"]])(
    "maps resolution denial %s to %s without exposing database details",
    async (code, expected) => {
      mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "private database detail" } });
      const result = await resolvePhaseANoShowSlot(client, "40000000-0000-4000-8000-000000000004", { bookingId: input.bookingId, slot: 2, resolution: "proceed_fewer" });
      expect(result).toMatchObject({ ok: false, error: { code: expected } });
      expect(JSON.stringify(result)).not.toContain("private database detail");
    },
  );
});
