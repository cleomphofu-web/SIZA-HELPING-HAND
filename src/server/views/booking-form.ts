import type { BookingRateCard } from "@/lib/booking-estimate";

export type BookingFormCategory = { name: string; enabled: boolean; pricing: string };
export type BookingFormRate = {
  service: string;
  hourly_cents: number | string;
  per_bedroom_minutes: number;
  per_bathroom_minutes: number;
  size_band_minutes: unknown;
  addon_minutes: unknown;
};
export type BookingFormZone = { suburb: string; transport_cents: number | string; enabled: boolean };
export type BookingFormHelper = {
  status: string;
  role: string;
  suburbs: string[];
  services: string[];
  first_job_completed_at: string | null;
  subscription_status: string;
  subscription_paid_until: string | null;
};
export type HostBookingFormView = {
  services: Array<BookingRateCard & { hourlyCents: string }>;
  areas: Array<{ suburb: string; transportCents: string; serviceKeys: string[]; serviceSets: Array<{ services: string[]; eligibleHelperCount: number }> }>;
  floorPercent: number | null;
  genderMatchingEnabled: boolean;
};

function minuteMap(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.some(([, minutes]) => !Number.isSafeInteger(minutes) || (minutes as number) < 0)) return null;
  return Object.fromEntries(entries) as Record<string, number>;
}

function validRate(rate: BookingFormRate): BookingRateCard | null {
  if (!/^\d+$/.test(String(rate.hourly_cents))) return null;
  const sizeBandMinutes = minuteMap(rate.size_band_minutes);
  const addonMinutes = minuteMap(rate.addon_minutes);
  const hourlyCents = BigInt(String(rate.hourly_cents));
  if (hourlyCents < BigInt(0) || !Number.isSafeInteger(rate.per_bedroom_minutes) || rate.per_bedroom_minutes < 0 || !Number.isSafeInteger(rate.per_bathroom_minutes) || rate.per_bathroom_minutes < 0) return null;
  if (!sizeBandMinutes || !["small", "medium", "large"].every((band) => Number.isSafeInteger(sizeBandMinutes[band]))) return null;
  if (!addonMinutes) return null;
  return {
    service: rate.service,
    hourlyCents: hourlyCents.toString(),
    perBedroomMinutes: rate.per_bedroom_minutes,
    perBathroomMinutes: rate.per_bathroom_minutes,
    sizeBandMinutes,
    addonMinutes,
  };
}

export function buildHostBookingFormView(input: {
  categories: readonly BookingFormCategory[];
  rates: readonly BookingFormRate[];
  zones: readonly BookingFormZone[];
  approvedHelpers: readonly BookingFormHelper[];
  floorPercent: number | null;
  genderMatchingEnabled?: boolean;
  now?: Date;
}): HostBookingFormView {
  const now = input.now ?? new Date();
  const availableCategories = new Map(input.categories
    .filter((category) => category.enabled && category.pricing === "rate_card")
    .map((category) => [category.name, category]));
  const services = input.rates.flatMap((rate) => {
    if (!availableCategories.has(rate.service)) return [];
    const parsed = validRate(rate);
    return parsed ? [{ ...parsed, hourlyCents: String(rate.hourly_cents) }] : [];
  });
  const eligibleServiceSets = (keys: string[], helpers: readonly BookingFormHelper[]): Array<{ services: string[]; eligibleHelperCount: number }> => {
    const result: Array<{ services: string[]; eligibleHelperCount: number }> = [];
    if (keys.length > 10) return result;
    for (let mask = 1; mask < 2 ** keys.length; mask += 1) {
      const selection = keys.filter((_, index) => (mask & (1 << index)) !== 0);
      const count = helpers.filter((helper) => selection.every((service) => helper.services.includes(service))).length;
      if (count >= 3) result.push({ services: selection, eligibleHelperCount: count });
    }
    return result;
  };
  const areas = input.zones.filter((zone) => zone.enabled && /^\d+$/.test(String(zone.transport_cents))).flatMap((zone) => {
    const helpers = input.approvedHelpers.filter((helper) => helper.role === "helper"
      && helper.status === "approved"
      && helper.suburbs.includes(zone.suburb)
      && (!helper.first_job_completed_at || (helper.subscription_status === "active"
        && helper.subscription_paid_until !== null
        && new Date(helper.subscription_paid_until).getTime() > now.getTime())));
    const serviceSets = eligibleServiceSets(services.map((service) => service.service), helpers);
    const serviceKeys = [...new Set(serviceSets.flatMap((set) => set.services))];
    return serviceKeys.length ? [{ suburb: zone.suburb, transportCents: String(zone.transport_cents), serviceKeys, serviceSets }] : [];
  });
  return { services, areas, floorPercent: input.floorPercent, genderMatchingEnabled: input.genderMatchingEnabled === true };
}
