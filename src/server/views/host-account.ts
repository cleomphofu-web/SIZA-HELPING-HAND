export type HostAccountRecord = {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type HostAccountActor = { userId: string; role: string };
export type HostAccountView = { firstName: string; lastName: string; phone: string };

export function viewHostAccountForActor(record: HostAccountRecord | null, actor: HostAccountActor): HostAccountView | null {
  if (actor.role !== "host" || (record && record.userId !== actor.userId)) return null;
  if (!record) return null;
  return { firstName: record.firstName, lastName: record.lastName, phone: record.phone };
}
