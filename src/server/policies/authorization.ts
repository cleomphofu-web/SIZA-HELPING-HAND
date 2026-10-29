export type AppRole = "host" | "helper" | "admin";
export type Actor = { id: string; role: AppRole };

export class AuthorizationError extends Error {
  constructor() {
    super("forbidden");
    this.name = "AuthorizationError";
  }
}

export function assertRole<T extends AppRole>(actor: Actor, role: T): Actor & { role: T } {
  if (actor.role !== role && actor.role !== "admin") throw new AuthorizationError();
  return actor as Actor & { role: T };
}

export function assertOwner(actor: Actor, ownerId: string): Actor {
  if (actor.role !== "admin" && actor.id !== ownerId) throw new AuthorizationError();
  return actor;
}
