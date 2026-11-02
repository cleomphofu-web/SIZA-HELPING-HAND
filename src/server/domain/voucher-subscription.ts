import { z } from "zod";

export const VoucherProviderSchema = z.enum(["1voucher", "ott", "blu_voucher", "other"]);
export type VoucherProvider = z.infer<typeof VoucherProviderSchema>;

export const HelperVoucherSubmissionSchema = z.object({
  provider: VoucherProviderSchema,
  pin: z.string().trim().min(8).max(30).regex(/^[A-Za-z0-9\- ]+$/, "Enter a valid voucher PIN or code"),
  periodMonths: z.coerce.number().int().refine((val) => [1, 3, 6].includes(val), {
    message: "Period must be 1, 3, or 6 months",
  }),
}).strict();

export type HelperVoucherSubmissionInput = z.infer<typeof HelperVoucherSubmissionSchema>;
