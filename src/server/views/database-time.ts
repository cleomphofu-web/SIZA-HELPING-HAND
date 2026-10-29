import "server-only";

type DatabaseClockClient = {
  rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }>;
};

export async function getDatabaseNow(client: DatabaseClockClient): Promise<Date | null> {
  const { data, error } = await client.rpc("get_phase_a_database_now");
  if (error || typeof data !== "string") return null;
  const milliseconds = Date.parse(data);
  return Number.isFinite(milliseconds) ? new Date(milliseconds) : null;
}
