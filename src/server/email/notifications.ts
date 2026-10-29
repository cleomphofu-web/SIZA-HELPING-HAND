import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { Resend } from "resend";
import { t } from "@/content/t";
import type { CopyKey } from "@/content/copy.generated";
import { env } from "@/server/config/env";

const resend = new Resend(env.RESEND_API_KEY);
const recipientSchema = z.string().email().max(254);
const firstNameSchema = z.string().trim().min(1).max(80).refine((value) => !/[\r\n]/.test(value));
const plainVariableSchema = z.string().trim().min(1).max(100).refine((value) => !/[\r\n]/.test(value));

function checkedName(value: string) {
  const parsed = firstNameSchema.safeParse(value);
  if (!parsed.success) throw new Error("Email notification could not be prepared");
  return parsed.data;
}

function checkedPlainVariable(value: string) {
  const parsed = plainVariableSchema.safeParse(value);
  if (!parsed.success) throw new Error("Email notification could not be prepared");
  return parsed.data;
}

function checkedDate(value: Date) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error("Email notification could not be prepared");
  return value.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" });
}

function notificationKey(event: string, entityId: string) {
  const parsed = z.string().uuid().safeParse(entityId);
  if (!parsed.success) throw new Error("Email notification could not be prepared");
  const eventDigest = createHash("sha256").update(`${event}:${parsed.data}`).digest("hex");
  return `siza:${event}:${eventDigest}`;
}

async function send(subjectKey: CopyKey, bodyKey: CopyKey, to: string, entityId: string, event: string, variables: Record<string, string> = {}) {
  const recipient = recipientSchema.safeParse(to);
  if (!recipient.success) throw new Error("Email notification could not be prepared");

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: recipient.data,
    subject: t(subjectKey, variables),
    text: t(bodyKey, variables),
  }, { idempotencyKey: notificationKey(event, entityId) });
  if (error) throw new Error("Email delivery failed");
}

export async function sendHelperApproved(to: string, firstName: string, helperId: string) {
  await send("email.helper.approved.subject", "email.helper.approved.body", to, helperId, "helper-approved", { firstName: checkedName(firstName) });
}

export async function sendHelperRejected(to: string, firstName: string, helperId: string) {
  await send("email.helper.declined.subject", "email.helper.declined.body", to, helperId, "helper-declined", { firstName: checkedName(firstName) });
}

export async function notifyAdminNewBooking(bookingId: string) {
  await send("email.admin.new_request.subject", "email.admin.new_request.body", env.ADMIN_NOTIFY_EMAIL, bookingId, "admin-new-request");
}

export async function notifyAdminNewApplication(helperId: string) {
  await send("email.admin.new_application.subject", "email.admin.new_application.body", env.ADMIN_NOTIFY_EMAIL, helperId, "admin-new-application");
}

export async function notifyHostBookingRequested(to: string, firstName: string, service: string, startAt: Date, bookingId: string) {
  await send("email.host.requested.subject", "email.host.requested.body", to, bookingId, "host-booking-requested", {
    firstName: checkedName(firstName),
    service: checkedPlainVariable(service),
    date: checkedDate(startAt),
  });
}

export async function notifyHostBookingAssigned(to: string, firstName: string, helperName: string, service: string, startAt: Date, checkInCode: string, bookingId: string) {
  if (!/^\d{6}$/.test(checkInCode)) throw new Error("Email notification could not be prepared");
  await send("email.host.assigned.subject", "email.host.assigned.body", to, bookingId, "host-booking-assigned", {
    firstName: checkedName(firstName),
    helperName: checkedName(helperName),
    service: checkedPlainVariable(service),
    date: checkedDate(startAt),
    code: checkInCode,
  });
}

export async function notifyHelperJobAssigned(to: string, firstName: string, startAt: Date, assignmentId: string) {
  await send("email.helper.job_assigned.subject", "email.helper.job_assigned.body", to, assignmentId, "helper-job-assigned", {
    firstName: checkedName(firstName),
    date: checkedDate(startAt),
  });
}

export async function notifyHostNoHelper(to: string, firstName: string, bookingId: string) {
  await send("email.host.no_helper.subject", "email.host.no_helper.body", to, bookingId, "host-no-helper", { firstName: checkedName(firstName) });
}
