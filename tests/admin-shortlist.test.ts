import { describe, expect, it } from "vitest";
import { resolveAdminShortlistSelection, toAdminShortlistSelection, type AdminShortlistSource } from "@/server/views/admin-shortlist";

const rows: AdminShortlistSource[] = [
  { helperId: "private-helper-id-1", rateNote: "Experienced", firstName: "Sam", phone: "+27820000001" },
  { helperId: "private-helper-id-2", rateNote: "New", firstName: "Lee", phone: "+27820000002" },
];

describe("admin shortlist read boundary", () => {
  it("returns display candidates without helper identifiers", () => {
    const selection = toAdminShortlistSelection(rows);
    expect(selection.candidates).toEqual([
      { index: 0, rateNote: "Experienced", profile: { first_name: "Sam", phone: "+27820000001" } },
      { index: 1, rateNote: "New", profile: { first_name: "Lee", phone: "+27820000002" } },
    ]);
    expect(JSON.stringify(selection)).not.toContain("private-helper-id");
  });

  it("resolves selected indices server-side only for the current shortlist version", () => {
    const selection = toAdminShortlistSelection(rows);
    expect(resolveAdminShortlistSelection(rows, selection.version, [1])).toEqual(["private-helper-id-2"]);
    expect(() => resolveAdminShortlistSelection(rows, "0".repeat(64), [1])).toThrow(/shortlist changed/);
    const changed = rows.map((row, index) => index === 0 ? { ...row, phone: "+27829999999" } : row);
    expect(() => resolveAdminShortlistSelection(changed, selection.version, [1])).toThrow(/shortlist changed/);
  });

  it("rejects duplicate, excessive, and out-of-range selections", () => {
    const { version } = toAdminShortlistSelection(rows);
    expect(() => resolveAdminShortlistSelection(rows, version, [1, 1])).toThrow();
    expect(() => resolveAdminShortlistSelection(rows, version, [0, 1, 2, 3, 4])).toThrow();
    expect(() => resolveAdminShortlistSelection(rows, version, [2])).toThrow();
  });
});
