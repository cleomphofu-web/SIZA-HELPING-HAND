import { z } from "zod";

export const AdminMfaCodeSchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
}).strict();

export const AdminMfaSetupSchema = z.object({ intent: z.literal("setup") }).strict();
