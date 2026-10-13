import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);
const from = env.RESEND_FROM_EMAIL;

async function send(subject: string, text: string, to: string) {
  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) throw new Error("Email delivery failed");
}

export async function sendCleanerApproved(to: string, name: string, freeUntil: Date) {
  await send("Welcome to SIZA", `Hi ${name},\n\nYour SIZA application has been approved. Your free period runs until ${freeUntil.toLocaleDateString("en-ZA")}.\n\nPayment goes directly from the client to you after completion. Photos of the job are required. Repeated no-shows or complaints may result in removal.\n\nWhatsApp group: ${env.WHATSAPP_GROUP_LINK}`, to);
}

export async function sendCleanerRejected(to: string, name: string, reason?: string) {
  await send("Your SIZA application", `Hi ${name},\n\nThank you for applying to SIZA. We are unable to approve your application at this stage.${reason ? `\n\nReason: ${reason}` : ""}\n\nRegards,\nSIZA`, to);
}

export async function notifyAdminNewBooking(id: string) {
  await send("New SIZA booking request", `A new booking request has arrived.\n\nBooking ID: ${id}`, env.ADMIN_NOTIFY_EMAIL);
}

export async function notifyAdminNewApplication(id: string) {
  await send("New SIZA cleaner application", `A new cleaner application has arrived.\n\nApplication ID: ${id}`, env.ADMIN_NOTIFY_EMAIL);
}
