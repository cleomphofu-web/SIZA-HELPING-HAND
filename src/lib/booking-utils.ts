type BookingSummaryInput = { suburb: string; start_at: string; property_type: string; helpers_needed: number; access_notes: string };

export function buildJobSummary(booking: BookingSummaryInput) {
  return [`siZa job — ${booking.suburb}`, `Date/time: ${new Date(booking.start_at).toLocaleString("en-ZA")}`, `Property: ${booking.property_type}`, `Helpers needed: ${booking.helpers_needed}`, `Access notes: ${booking.access_notes || "None provided"}`].join("\n");
}

export function whatsappLink(phone: string, text?: string) {
  const digits = phone.replace(/^\+/, "").replace(/\D/g, "");
  if (!/^27[6-8]\d{8}$/.test(digits)) throw new Error("Invalid WhatsApp number");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function isUnassignedUrgent(booking: { start_at: string; assigned_helper_ids?: string[] }, now = new Date(), thresholdHours = 24) {
  return (!booking.assigned_helper_ids || booking.assigned_helper_ids.length === 0) && new Date(booking.start_at).getTime() - now.getTime() <= thresholdHours * 60 * 60 * 1000;
}
