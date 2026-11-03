import { z } from "zod";

export const CancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
}).strict();

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

export const EditBookingNotesSchema = z.object({
  bookingId: z.string().uuid(),
  accessNotes: z.string().trim().max(1000),
}).strict();

export type EditBookingNotesInput = z.infer<typeof EditBookingNotesSchema>;

