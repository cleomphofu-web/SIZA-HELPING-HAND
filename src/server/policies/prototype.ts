import { notFound } from "next/navigation";
import { prototypeRoutesEnabled } from "@/lib/prototype";

export { isPrototypePath, prototypeRoutesEnabled } from "@/lib/prototype";

/** Use as the first statement in every server action. */
export function requirePrototypeRoutes() {
  if (!prototypeRoutesEnabled()) notFound();
}

