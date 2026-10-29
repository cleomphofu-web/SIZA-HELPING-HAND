import { recommendedPayForServices } from "@/lib/money";

export type HomeSizeBand = "small" | "medium" | "large";

export type BookingEstimateInput = {
  primaryService: string;
  services: readonly string[];
  bedrooms: number;
  bathrooms: number;
  sizeBand: HomeSizeBand;
  addons: readonly string[];
};

export type BookingRateCard = {
  service: string;
  hourlyCents: number | string | bigint;
  perBedroomMinutes: number;
  perBathroomMinutes: number;
  sizeBandMinutes: Partial<Record<HomeSizeBand, number>>;
  addonMinutes: Record<string, number>;
};

/** Pure estimate math. Callers must load all values from trusted server configuration. */
export function estimateBooking(input: BookingEstimateInput, rateCards: readonly BookingRateCard[]) {
  if (!input.services.length || new Set(input.services).size !== input.services.length) {
    throw new Error("Select each service only once");
  }
  if (!input.services.includes(input.primaryService)) throw new Error("Choose a primary service from the selected services");
  if (!Number.isInteger(input.bedrooms) || input.bedrooms < 0 || !Number.isInteger(input.bathrooms) || input.bathrooms < 0) {
    throw new Error("Room counts must be whole, non-negative numbers");
  }
  if (new Set(input.addons).size !== input.addons.length) throw new Error("Choose each extra only once");

  const cards = new Map<string, BookingRateCard>();
  for (const card of rateCards) {
    if (cards.has(card.service)) throw new Error("Duplicate rate-card configuration");
    cards.set(card.service, card);
  }

  const primary = cards.get(input.primaryService);
  if (!primary) throw new Error("The selected service is not configured");
  const serviceCards = input.services.map((service) => {
    const card = cards.get(service);
    if (!card) throw new Error("The selected service is not configured");
    return card;
  });

  const sizeMinutes = input.sizeBand in primary.sizeBandMinutes ? primary.sizeBandMinutes[input.sizeBand] : undefined;
  if (!Number.isSafeInteger(sizeMinutes) || sizeMinutes! < 0) throw new Error("This home size is not configured");
  for (const minutes of [primary.perBedroomMinutes, primary.perBathroomMinutes]) {
    if (!Number.isSafeInteger(minutes) || minutes < 0) throw new Error("The selected service estimate is not configured");
  }

  const addonMinutes = input.addons.reduce((total, addon) => {
    const minutes = primary.addonMinutes[addon];
    if (!Number.isSafeInteger(minutes) || minutes! < 0) throw new Error("One of the selected extras is not configured");
    return total + minutes!;
  }, 0);
  const estimatedMinutes = sizeMinutes! + primary.perBedroomMinutes * input.bedrooms + primary.perBathroomMinutes * input.bathrooms + addonMinutes;
  if (!Number.isSafeInteger(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 1440) {
    throw new Error("This request is outside the configured estimate range");
  }

  const recommendedPayCents = recommendedPayForServices(serviceCards.map((card) => card.hourlyCents), estimatedMinutes);
  return { estimatedMinutes, recommendedPayCents };
}

export function resolveBookingAmounts(input: {
  recommendedPayCents: bigint;
  floorPercent: number;
  requestedPayCents: bigint | null;
  suggestedTransportCents: bigint;
  requestedTransportCents: bigint | null;
}) {
  if (!Number.isSafeInteger(input.floorPercent) || input.floorPercent < 0 || input.floorPercent > 100 || input.recommendedPayCents < BigInt(0) || input.suggestedTransportCents < BigInt(0)) {
    throw new Error("Invalid booking amount configuration");
  }
  const minimumPayCents = (input.recommendedPayCents * BigInt(input.floorPercent) + BigInt(99)) / BigInt(100);
  const payCents = input.requestedPayCents ?? input.recommendedPayCents;
  const transportCents = input.requestedTransportCents ?? input.suggestedTransportCents;
  if (payCents < minimumPayCents) throw new Error("Pay is below the configured minimum");
  if (transportCents < input.suggestedTransportCents) throw new Error("Transport is below the area suggestion");
  return { payCents, transportCents, minimumPayCents };
}
