import { z } from "zod";

export const HelperYocoSubmissionSchema = z.object({
  reference: z.string().trim().min(3, "Payment reference must be at least 3 characters").max(100, "Reference too long"),
  periodMonths: z.union([z.literal(1), z.literal(3), z.literal(6)]).default(1),
}).strict();

export type HelperYocoSubmissionInput = z.infer<typeof HelperYocoSubmissionSchema>;

