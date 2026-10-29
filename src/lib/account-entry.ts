export type AccountEntryRole = "host" | "helper";

/**
 * Narrows the untrusted `role` query value used by the shared account entry
 * route. Unknown or repeated values deliberately use the host entry point.
 */
export function accountEntryRole(
  role: string | string[] | undefined,
): AccountEntryRole {
  return role === "helper" ? "helper" : "host";
}
