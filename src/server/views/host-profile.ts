export type HostProfileRecord = {
  userId: string;
  addressLine: string | null;
  suburb: string | null;
  city: string | null;
  notesDefault: string | null;
};

export type HostProfileActor = { userId: string; role: string };
export type HostProfileView = { addressLine: string; suburb: string; city: string; notesDefault: string };

export function viewHostProfileForActor(record: HostProfileRecord | null, actor: HostProfileActor): HostProfileView | null {
  if (actor.role !== "host" || (record && record.userId !== actor.userId)) return null;
  return {
    addressLine: record?.addressLine ?? "",
    suburb: record?.suburb ?? "",
    city: record?.city ?? "Johannesburg",
    notesDefault: record?.notesDefault ?? "",
  };
}
