import { describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { runRequestPipelineCore } from "@/server/policies/request-pipeline-core";

function dependencies(overrides: Partial<Parameters<typeof runRequestPipelineCore>[0]> = {}) {
  const calls: string[] = [];
  const defaults: Parameters<typeof runRequestPipelineCore>[0] = {
    prototype: () => { calls.push("prototype"); },
    rateLimit: async () => { calls.push("rate"); return { allowed: true }; },
    botCheck: async () => { calls.push("bot"); return true; },
    validate: async () => { calls.push("validate"); return { ok: true as const, data: { value: "valid" } }; },
    authorize: async () => { calls.push("authorize"); return { ok: true as const, data: { role: "host" } }; },
    service: async () => { calls.push("service"); return "saved"; },
  };
  return { calls, input: { ...defaults, ...overrides } };
}

describe("shared request pipeline", () => {
  it("runs prototype, rate, bot, validation, authorization, then service in order", async () => {
    const { calls, input } = dependencies();
    await runRequestPipelineCore(input);
    expect(calls).toEqual(["prototype", "rate", "bot", "validate", "authorize", "service"]);
  });

  it("fails closed at each denied stage and never calls a later stage", async () => {
    const stages = ["prototype", "rate_limit", "bot_check", "input_validation", "authorization"] as const;
    for (const stage of stages) {
      const { calls } = dependencies();
      const input = {
        prototype: () => { calls.push("prototype"); if (stage === "prototype") throw new Error("disabled"); },
        rateLimit: async () => { calls.push("rate"); return { allowed: stage !== "rate_limit" }; },
        botCheck: async () => { calls.push("bot"); return stage !== "bot_check"; },
        validate: async () => { calls.push("validate"); return stage === "input_validation" ? { ok: false as const, error: "bad" } : { ok: true as const, data: { value: "valid" } }; },
        authorize: async () => { calls.push("authorize"); return stage === "authorization" ? { ok: false as const, error: "denied" } : { ok: true as const, data: { role: "host" } }; },
        service: async () => { calls.push("service"); return "saved"; },
      };
      if (stage === "prototype") {
        await expect(runRequestPipelineCore(input)).rejects.toThrow("disabled");
      } else {
        expect(await runRequestPipelineCore(input)).toMatchObject({ ok: false, stage });
      }
      const order = ["prototype", "rate", "bot", "validate", "authorize", "service"];
      expect(calls).toEqual(order.slice(0, [1, 2, 3, 4, 5][stages.indexOf(stage)]));
    }
  });

  it("fails closed and does not invoke services when a gate callback throws", async () => {
    const rateLimit = vi.fn(async () => { throw new Error("provider unavailable"); });
    const service = vi.fn(async () => "saved");
    const { input } = dependencies({ rateLimit, service });
    expect(await runRequestPipelineCore(input)).toMatchObject({ ok: false, stage: "rate_limit", retryAfterSeconds: 60 });
    expect(service).not.toHaveBeenCalled();
  });

  it("treats a malformed-body parser exception as invalid input without authorizing or calling the service", async () => {
    const authorize = vi.fn(async () => ({ ok: true as const, data: { role: "host" } }));
    const service = vi.fn(async () => "saved");
    const { input } = dependencies({ validate: async () => { throw new SyntaxError("invalid JSON"); }, authorize, service });
    expect(await runRequestPipelineCore(input)).toMatchObject({ ok: false, stage: "input_validation" });
    expect(authorize).not.toHaveBeenCalled();
    expect(service).not.toHaveBeenCalled();
  });

  it("routes every API handler and admin server action through the shared pipeline", () => {
    const root = process.cwd();
    const collect = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? collect(target) : [target];
    });
    const entrypoints = [
      ...collect(path.join(root, "src/app/api")).filter((file) => file.endsWith("route.ts")),
      ...collect(path.join(root, "src/app/(admin)/admin")).filter((file) => file.endsWith("actions.ts")),
    ];

    expect(entrypoints.length).toBeGreaterThan(0);
    for (const file of entrypoints.filter((entrypoint) => entrypoint.includes(`${path.sep}api${path.sep}`))) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(root, file)).toContain("runRequestPipeline");
      expect(source, path.relative(root, file)).not.toContain("requirePrototypeRoutes");
    }
    for (const file of entrypoints.filter((entrypoint) => entrypoint.endsWith("actions.ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(root, file)).toContain("runServerActionPipeline");
      expect(source, path.relative(root, file)).not.toContain("requirePrototypeRoutes");
    }
  });

  it("uses shared rate-limit identity and Retry-After handling across API routes", () => {
    const root = process.cwd();
    const collect = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? collect(target) : [target];
    });
    const routes = collect(path.join(root, "src/app/api")).filter((file) => file.endsWith("route.ts"));
    for (const file of routes) {
      const source = readFileSync(file, "utf8");
      if (source.includes("inspectLoginThrottle(")) {
        expect(source, path.relative(root, file)).toContain("recordFailedLogin(");
        expect(source, path.relative(root, file)).toContain("runRequestPipeline");
      } else {
        expect(source, path.relative(root, file)).toContain("limitRequest(");
      }
      if (source.includes("status: 429")) expect(source, path.relative(root, file)).toContain("rateLimitResponse(pipeline)");
    }
  });
});
