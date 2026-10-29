import { z } from "zod";

export const HelperIdSchema = z.string().uuid();
export const HelperVettingChecklistSchema = z.object({
  idMatchesSelfie: z.literal(true),
  idReadable: z.literal(true),
  referencesCalled: z.literal(true),
}).strict();
export const HelperDecisionSchema = z.object({
  id: HelperIdSchema,
  reason: z.string().max(1000).optional(),
}).strict();
export const HelperSuspensionSchema = z.object({
  id: HelperIdSchema,
  reason: z.string().trim().min(1).max(1000),
}).strict();
export const HelperDocumentIdSchema = z.string().uuid();
