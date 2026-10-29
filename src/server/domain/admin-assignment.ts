import { z } from "zod";

export const AdminAssignmentInputSchema = z.object({
  bookingId: z.string().uuid(),
  selection: z.object({
    version: z.string().regex(/^[a-f0-9]{64}$/),
    indexes: z.array(z.number().int().min(0)).min(1).max(4),
  }).strict().refine(({ indexes }) => new Set(indexes).size === indexes.length),
}).strict();

export const AdminBookingStatusInputSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(["cancelled", "disputed"]),
}).strict();

export const AdminBookingIdSchema = z.string().uuid();

export type AdminAssignmentInput = z.infer<typeof AdminAssignmentInputSchema>;
