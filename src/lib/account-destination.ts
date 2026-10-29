export type AccountRole = "host" | "helper";

export function accountDestinationForRole(role: unknown): "/app" | "/helper" | null {
  if (role === "host") return "/app";
  if (role === "helper") return "/helper";
  return null;
}
