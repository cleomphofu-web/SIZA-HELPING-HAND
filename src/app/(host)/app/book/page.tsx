import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { HostBookingForm } from "@/components/HostBookingForm";
import { env } from "@/server/config/env";
import { getOwnHostProfileView } from "@/server/views/host-profile-read";
import { getOwnHostBookingFormView } from "@/server/views/booking-form-read";

type HostBookPageProps = { searchParams: Promise<{ error?: string | string[] }> };

function bookingError(value: string | string[] | undefined): "rate_limited" | "validation" | "verify" | "not_open" | "pricing" | "failed" | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "rate_limited" || candidate === "validation" || candidate === "verify" || candidate === "not_open" || candidate === "pricing" || candidate === "failed"
    ? candidate
    : undefined;
}

export default async function HostBookPage({ searchParams }: HostBookPageProps) {
  const [profileResult, configResult, query] = await Promise.all([
    getOwnHostProfileView(),
    getOwnHostBookingFormView(),
    searchParams,
  ]);
  if (!profileResult.ok) redirect(profileResult.error.code === "unauthenticated" ? "/login" : "/");
  return <HostBookingForm
    profile={profileResult.data}
    config={configResult.ok ? configResult.data : { services: [], areas: [], floorPercent: null, genderMatchingEnabled: false }}
    turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
    idempotencyKey={randomUUID()}
    error={bookingError(query.error) ?? (!configResult.ok ? "failed" : undefined)}
  />;
}
