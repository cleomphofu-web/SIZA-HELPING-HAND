import "server-only";
import { headers } from "next/headers";
import { requirePrototypeRoutes } from "@/server/policies/prototype";
import { runRequestPipelineCore } from "@/server/policies/request-pipeline-core";
import { sameOriginHeaders } from "@/server/security/origin";

type StageResult<T> = { ok: true; data: T } | { ok: false; error: unknown };

/** The single server adapter for all API routes and server actions. */
export function runRequestPipeline<Input, Actor, Output>(steps: {
  rateLimit: () => Promise<{ allowed: boolean; retryAfterSeconds?: number }>;
  botCheck: () => Promise<boolean>;
  validate: () => Promise<StageResult<Input>>;
  authorize: (input: Input) => Promise<StageResult<Actor>>;
  service: (input: Input, actor: Actor) => Promise<Output>;
}) {
  return runRequestPipelineCore({ ...steps, prototype: requirePrototypeRoutes });
}

/** Server Actions use Next's shared pipeline plus a required browser-origin check. */
export function runServerActionPipeline<Input, Actor, Output>(steps: {
  rateLimit: () => Promise<{ allowed: boolean; retryAfterSeconds?: number }>;
  botCheck: () => Promise<boolean>;
  validate: () => Promise<StageResult<Input>>;
  authorize: (input: Input) => Promise<StageResult<Actor>>;
  service: (input: Input, actor: Actor) => Promise<Output>;
}) {
  return runRequestPipeline({
    ...steps,
    authorize: async (input) => {
      if (!sameOriginHeaders(await headers())) return { ok: false as const, error: "origin" };
      return steps.authorize(input);
    },
  });
}

