import { z } from "zod";

const saPhone = z.string().trim().min(10).max(20);

export function normaliseSaPhone(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  if (/^0[6-8]\d{8}$/.test(compact)) return `+27${compact.slice(1)}`;
  if (/^27[6-8]\d{8}$/.test(compact)) return `+${compact}`;
  if (/^\+27[6-8]\d{8}$/.test(compact)) return compact;
  return null;
}

const phone = saPhone.refine((value) => normaliseSaPhone(value) !== null, "Enter a valid South African phone number");

export const bookingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().email().max(254),
  suburb: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(300),
  propertyType: z.enum(["studio", "1-bed", "2-bed", "3-bed", "office", "other"]),
  cleanersNeeded: z.coerce.number().int().min(1).max(4),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  accessNotes: z.string().max(2000).default(""),
  notes: z.string().max(2000).default(""),
  consent: z.literal(true),
  honeypot: z.string().max(0).default(""),
}).strict().superRefine((value, context) => {
  if (value.startAt <= new Date()) context.addIssue({ code: "custom", path: ["startAt"], message: "Choose a future time" });
  if (value.endAt <= value.startAt) context.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after the start time" });
});

export const cleanerApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().email().max(254),
  suburbs: z.array(z.string().trim().min(2).max(80)).min(1).max(20),
  services: z.array(z.enum(["home", "airbnb_turnover", "office", "post_construction", "move_out"])).min(1).max(5),
  rateAmount: z.coerce.number().finite().nonnegative().max(100000),
  rateUnit: z.enum(["per_hour", "per_job"]),
  availability: z.string().trim().min(2).max(1000),
  idNumber: z.string().trim().min(6).max(30),
  references: z.array(z.object({ name: z.string().trim().min(2).max(120), phone }).strict()).length(2),
  consent: z.literal(true),
  honeypot: z.string().max(0).default(""),
}).strict();
