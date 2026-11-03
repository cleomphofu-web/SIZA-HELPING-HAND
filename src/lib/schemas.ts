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

function hasValidSouthAfricanIdDate(idNumber: string): boolean {
  const year = Number(idNumber.slice(0, 2));
  const month = Number(idNumber.slice(2, 4));
  const day = Number(idNumber.slice(4, 6));
  return [1900 + year, 2000 + year].some((fullYear) => {
    const date = new Date(Date.UTC(fullYear, month - 1, day));
    return date.getUTCFullYear() === fullYear && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  });
}

function hasValidSouthAfricanIdCheckDigit(idNumber: string): boolean {
  let total = 0;
  for (let index = 0; index < 12; index += 1) {
    let digit = Number(idNumber[index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    total += digit;
  }
  return (10 - (total % 10)) % 10 === Number(idNumber[12]);
}

const southAfricanIdNumber = z.string().trim().length(13)
  .regex(/^\d{13}$/)
  .refine(hasValidSouthAfricanIdDate, "Enter an ID number with a valid birth date")
  .refine(hasValidSouthAfricanIdCheckDigit, "Enter an ID number with a valid check digit");

export const bookingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().email().max(254),
  suburb: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(300),
  propertyType: z.enum(["studio", "1-bed", "2-bed", "3-bed", "office", "other"]),
  helpersNeeded: z.coerce.number().int().min(1).max(4),
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

export const helperApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().email().max(254),
  suburbs: z.array(z.string().trim().min(2).max(80)).min(1).max(20),
  services: z.array(z.enum(["home", "airbnb_turnover", "office", "post_construction", "move_out"])).min(1).max(5),
  rateAmount: z.coerce.number().finite().nonnegative().max(100000),
  rateUnit: z.enum(["per_hour", "per_job"]),
  availability: z.string().trim().min(2).max(1000),
  idNumber: southAfricanIdNumber,
  references: z.array(z.object({ name: z.string().trim().min(2).max(120), phone }).strict()).length(2),
  consent: z.literal(true),
  honeypot: z.string().max(0).default(""),
}).strict();

export const accountEntrySchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  role: z.enum(["host", "helper"]),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(120),
  phone,
  termsVersion: z.string().trim().min(1).max(40),
  privacyVersion: z.string().trim().min(1).max(40),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  honeypot: z.string().max(0).default(""),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
}).strict();

export const hostProfileSchema = z.object({
  addressLine: z.string().trim().min(5).max(300),
  suburb: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80).default("Johannesburg"),
  notesDefault: z.string().max(2000).default(""),
}).strict();

export const hostAccountSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(120),
  phone: phone.transform((value) => normaliseSaPhone(value)!),
}).strict();

const adultDate = z.coerce.date().refine((date) => {
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
  return date <= cutoff;
}, "Helpers must be 18 or older");

export const helperProfileSchema = z.object({
  dateOfBirth: adultDate,
  jobTitle: z.string().trim().min(2).max(120),
  services: z.array(z.string().trim().min(2).max(80)).min(1).max(10),
  suburbs: z.array(z.string().trim().min(2).max(80)).min(1).max(50),
  bio: z.string().max(300).default(""),
  experienceNote: z.string().max(2000).default(""),
  rateNote: z.string().max(500).default(""),
  idNumber: southAfricanIdNumber,
  referenceName: z.string().trim().min(2).max(120).optional(),
  referencePhone: z.string().trim().min(7).max(30).optional(),
  consent: z.literal(true),
}).strict();

export const helperGenderMatchPreferenceSchema = z.object({
  genderMatchGroup: z.enum(["female", "male", "none"]),
  consent: z.boolean(),
}).strict().refine(
  (value) => value.genderMatchGroup === "none" || value.consent === true,
  "Choose whether to opt in to this optional preference.",
);

const johannesburgLocalDateTime = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a valid date and time")
  .transform((value) => new Date(`${value}:00+02:00`))
  .refine((value) => Number.isFinite(value.getTime()), "Choose a valid date and time");
const bookingStartAt = z.union([johannesburgLocalDateTime, z.coerce.date()]);
const zarAmount = z.union([
  z.literal(""),
  z.string().trim().regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Enter an amount in rand"),
]).optional();

export const phaseABookingSchema = z.object({
  addressLine: z.string().trim().min(5).max(300),
  suburb: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80).default("Johannesburg"),
  services: z.array(z.string().trim().min(2).max(80)).min(1).max(10),
  primaryService: z.string().trim().min(2).max(80),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  sizeBand: z.enum(["small", "medium", "large"]),
  addons: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  helpersNeeded: z.coerce.number().int().min(1).max(4),
  startAt: bookingStartAt,
  genderPreference: z.enum(["any", "female", "male", "mix"]),
  payPerHelperZar: zarAmount,
  transportPerHelperZar: zarAmount,
  accessNotes: z.string().max(2000).default(""),
  idempotencyKey: z.string().uuid(),
  outsideAgreementNotice: z.literal(true),
  addressSharingNotice: z.literal(true),
  paymentNotice: z.literal(true),
}).strict().superRefine((value, context) => {
  if (new Set(value.services).size !== value.services.length) {
    context.addIssue({ code: "custom", path: ["services"], message: "Choose each service only once" });
  }
  if (!value.services.includes(value.primaryService)) {
    context.addIssue({ code: "custom", path: ["primaryService"], message: "Choose a primary service from the selected services" });
  }
  if (new Set(value.addons).size !== value.addons.length) {
    context.addIssue({ code: "custom", path: ["addons"], message: "Choose each extra only once" });
  }
  if (value.startAt <= new Date()) context.addIssue({ code: "custom", path: ["startAt"], message: "Choose a future time" });
});

export const acceptBookingSchema = z.object({ bookingId: z.string().uuid(), slot: z.coerce.number().int().min(1).max(4) }).strict();
export const checkInSchema = z.object({ bookingId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict();
export const checkInCodeRequestSchema = z.object({ bookingId: z.string().uuid() }).strict();
export const confirmBookingSchema = z.object({ bookingId: z.string().uuid() }).strict();
export const noShowSchema = z.object({ bookingId: z.string().uuid(), helperId: z.string().uuid() }).strict();
export const noShowResolutionSchema = z.object({ bookingId: z.string().uuid(), slot: z.coerce.number().int().min(1).max(4), resolution: z.enum(["proceed_fewer", "close_vacant_slot"]) }).strict();
export const reportSchema = z.object({
  idempotencyKey: z.string().uuid(),
  bookingId: z.string().uuid(),
  subjectId: z.string().uuid().nullable(),
  category: z.enum(["no_show", "safety", "payment", "conduct", "other"]),
  text: z.string().trim().min(1).max(3000),
}).strict();

/** Host post-job private survey: "Would you book this helper again through siZa?" */
export const repeatIntentSchema = z.object({
  bookingId: z.string().uuid(),
  helperId: z.string().uuid(),
  intent: z.enum(["yes", "no"]),
}).strict();

/** Host "Book Again" request — creates a new booking pre-filled from a past one */
export const bookAgainSchema = z.object({
  sourceBookingId: z.string().uuid(),
  helperId: z.string().uuid(),
}).strict();
