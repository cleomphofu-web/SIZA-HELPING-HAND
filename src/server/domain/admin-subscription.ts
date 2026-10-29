import { z } from "zod";

export const RecordSubscriptionPaymentSchema = z.object({
  helperId: z.string().uuid(),
  amountCents: z.coerce.number().int().positive(),
  periodMonths: z.coerce.number().int().refine((val) => [1, 3, 6].includes(val), {
    message: "Period must be 1, 3, or 6 months",
  }),
  reference: z.string().trim().min(3).max(100),
}).strict();

export type RecordSubscriptionPaymentInput = z.infer<typeof RecordSubscriptionPaymentSchema>;

