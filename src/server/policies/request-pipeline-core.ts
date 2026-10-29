type StageResult<T> = { ok: true; data: T } | { ok: false; error: unknown };

export type RequestPipelineStop = "rate_limit" | "bot_check" | "input_validation" | "authorization";

export type RequestPipelineResult<T> =
  | { ok: true; data: T }
  | { ok: false; stage: RequestPipelineStop; error?: unknown; retryAfterSeconds?: number };

/** Side-effect-free ordered core; adapters provide the framework and domain operations. */
export async function runRequestPipelineCore<Input, Actor, Output>(steps: {
  prototype: () => void | Promise<void>;
  rateLimit: () => Promise<{ allowed: boolean; retryAfterSeconds?: number }>;
  botCheck: () => Promise<boolean>;
  validate: () => Promise<StageResult<Input>>;
  authorize: (input: Input) => Promise<StageResult<Actor>>;
  service: (input: Input, actor: Actor) => Promise<Output>;
}): Promise<RequestPipelineResult<Output>> {
  await steps.prototype();

  let rate: Awaited<ReturnType<typeof steps.rateLimit>>;
  try { rate = await steps.rateLimit(); } catch { return { ok: false, stage: "rate_limit", retryAfterSeconds: 60 }; }
  if (!rate.allowed) return { ok: false, stage: "rate_limit", retryAfterSeconds: rate.retryAfterSeconds };

  try { if (!(await steps.botCheck())) return { ok: false, stage: "bot_check" }; } catch { return { ok: false, stage: "bot_check" }; }

  let parsed: Awaited<ReturnType<typeof steps.validate>>;
  try { parsed = await steps.validate(); } catch { return { ok: false, stage: "input_validation" }; }
  if (!parsed.ok) return { ok: false, stage: "input_validation", error: parsed.error };

  const authorization = await steps.authorize(parsed.data);
  if (!authorization.ok) return { ok: false, stage: "authorization", error: authorization.error };

  return { ok: true, data: await steps.service(parsed.data, authorization.data) };
}
