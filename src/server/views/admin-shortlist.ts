import { createHash } from "node:crypto";

export type AdminShortlistSource = { helperId: string; rateNote: string; firstName: string; phone: string };
export type AdminShortlistCandidate = { index: number; rateNote: string; profile: { first_name: string; phone: string } };

function versionFor(rows: AdminShortlistSource[]) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

export function toAdminShortlistSelection(rows: AdminShortlistSource[]) {
  return {
    version: versionFor(rows),
    candidates: rows.map((row, index): AdminShortlistCandidate => ({
      index,
      rateNote: row.rateNote,
      profile: { first_name: row.firstName, phone: row.phone },
    })),
  };
}

export function resolveAdminShortlistSelection(rows: AdminShortlistSource[], version: string, indexes: number[]) {
  if (!/^[a-f0-9]{64}$/.test(version) || !Array.isArray(indexes) || indexes.length < 1 || indexes.length > 4 || indexes.some((index) => !Number.isInteger(index) || index < 0) || new Set(indexes).size !== indexes.length) {
    throw new Error("Select between one and four helpers");
  }
  if (versionFor(rows) !== version) throw new Error("The helper shortlist changed. Refresh and choose again.");
  const helperIds = indexes.map((index) => rows[index]?.helperId);
  if (helperIds.some((helperId) => !helperId)) throw new Error("The helper selection is no longer available.");
  return helperIds as string[];
}
