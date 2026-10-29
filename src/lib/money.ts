const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatZarCents(value: number | string | bigint): string {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new Error("Money in cents must be a safe integer");
  }
  const cents = BigInt(value);
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const negative = cents < zero;
  const magnitude = negative ? -cents : cents;
  const whole = magnitude / hundred;
  const fraction = (magnitude % hundred).toString().padStart(2, "0");
  const formatted = zarFormatter.formatToParts(whole)
    .map((part) => part.type === "fraction" ? fraction : part.value)
    .join("");
  return negative ? `-${formatted}` : formatted;
}

export function parseZarToCents(value: string | undefined): bigint | null {
  if (value === undefined || value.trim() === "") return null;
  const normalized = value.trim();
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(normalized)) throw new Error("Invalid rand amount");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

export function recommendedPayForServices(hourlyRatesCents: readonly (number | string | bigint)[], estimatedMinutes: number): bigint {
  if (!hourlyRatesCents.length || !Number.isSafeInteger(estimatedMinutes) || estimatedMinutes < 1) {
    throw new Error("Invalid recommended pay inputs");
  }

  const totalHourlyCents = hourlyRatesCents.reduce<bigint>((total, rate) => {
    const cents = BigInt(rate);
    if (cents < BigInt(0)) throw new Error("Hourly rates cannot be negative");
    return total + cents;
  }, BigInt(0));
  const minutes = BigInt(estimatedMinutes);
  return (totalHourlyCents * minutes + BigInt(59)) / BigInt(60);
}
