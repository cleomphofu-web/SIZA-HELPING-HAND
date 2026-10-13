import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cleanerApplicationSchema, normaliseSaPhone } from "@/lib/schemas";
import { encryptIdNumber } from "@/lib/crypto";
import { validateUpload } from "@/lib/uploads";
import { limit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyAdminNewApplication } from "@/lib/email";

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function text(form: FormData, key: string) { return String(form.get(key) ?? ""); }

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rate = await limit("apply", ip);
  if (!rate.allowed) return NextResponse.json({ ok: false, error: "Please try again later" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const uploadedPaths: string[] = [];
  let cleanerId: string | null = null;
  const supabase = createSupabaseAdminClient();
  try {
    const form = await request.formData();
    if (!(await verifyTurnstile(text(form, "turnstileToken"), ip))) return NextResponse.json({ ok: false, error: "We could not verify this request" }, { status: 400 });
    const references = [
      { name: text(form, "referenceOneName"), phone: text(form, "referenceOnePhone") },
      { name: text(form, "referenceTwoName"), phone: text(form, "referenceTwoPhone") },
    ];
    const parsed = cleanerApplicationSchema.safeParse({
      fullName: text(form, "fullName"), phone: text(form, "phone"), email: text(form, "email"),
      suburbs: text(form, "suburbs").split(",").map((item) => item.trim()).filter(Boolean),
      services: text(form, "services").split(",").map((item) => item.trim()).filter(Boolean),
      rateAmount: text(form, "rateAmount"), rateUnit: text(form, "rateUnit"), availability: text(form, "availability"),
      idNumber: text(form, "idNumber"), references, consent: form.get("consent") === "on", honeypot: text(form, "honeypot"),
    });
    if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    if (parsed.data.honeypot) return NextResponse.json({ ok: true });

    const files = [
      ["profile_photo", form.get("profilePhoto")], ["selfie_id", form.get("selfieId")],
      ["id_document", form.get("idDocument")], ["proof_of_address", form.get("proofOfAddress")],
    ] as const;
    const checkedFiles: Array<{ type: (typeof files)[number][0]; file: File; ext: string }> = [];
    for (const [type, value] of files) {
      if (!(value instanceof File) || value.size === 0) return NextResponse.json({ ok: false, error: "All required documents must be provided" }, { status: 400 });
      const result = validateUpload({ name: value.name, size: value.size, bytes: new Uint8Array(await value.arrayBuffer()) });
      if (!result.ok) return NextResponse.json({ ok: false, error: "One or more uploads is invalid" }, { status: 400 });
      checkedFiles.push({ type, file: value, ext: result.ext });
    }

    const { data: cleaner, error: cleanerError } = await supabase.from("cleaners").insert({
      full_name: parsed.data.fullName, phone: normaliseSaPhone(parsed.data.phone), email: parsed.data.email,
      suburbs: parsed.data.suburbs, services: parsed.data.services, rate_amount: parsed.data.rateAmount,
      rate_unit: parsed.data.rateUnit, availability: parsed.data.availability,
      id_number_encrypted: encryptIdNumber(parsed.data.idNumber), status: "pending",
    }).select("id").single();
    if (cleanerError || !cleaner) throw new Error("Could not create application");
    cleanerId = cleaner.id;

    for (const { type, file, ext } of checkedFiles) {
      const path = `${cleaner.id}/${type}-${randomUUID()}.${ext}`;
      const upload = await supabase.storage.from("cleaner-docs").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upload.error) throw new Error("Could not store document");
      uploadedPaths.push(path);
      const document = await supabase.from("cleaner_documents").insert({ cleaner_id: cleaner.id, type, storage_path: path });
      if (document.error) throw new Error("Could not record document");
    }
    const referenceInsert = await supabase.from("cleaner_references").insert(references.map((reference) => ({ cleaner_id: cleaner.id, name: reference.name, phone: normaliseSaPhone(reference.phone) })));
    if (referenceInsert.error) throw new Error("Could not record references");
    await notifyAdminNewApplication(cleaner.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    if (uploadedPaths.length) await supabase.storage.from("cleaner-docs").remove(uploadedPaths);
    if (cleanerId) await supabase.from("cleaners").delete().eq("id", cleanerId);
    return NextResponse.json({ ok: false, error: "We could not process your application" }, { status: 500 });
  }
}
