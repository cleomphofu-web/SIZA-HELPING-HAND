export type SubscriptionStatus = "none" | "active" | "lapsed";

export function canAcceptJob(input: { firstJobCompletedAt: string | null; subscriptionStatus: SubscriptionStatus; paidUntil: Date | null; now: Date }): boolean {
  if (input.firstJobCompletedAt === null) return true;
  return input.subscriptionStatus === "active" && input.paidUntil !== null && input.paidUntil > input.now;
}

export function extendSubscription(paidUntil: Date | null, now: Date, periodDays: number): Date {
  const start = paidUntil !== null && paidUntil > now ? paidUntil : now;
  const result = new Date(start);
  result.setUTCDate(result.getUTCDate() + periodDays);
  return result;
}

/** Extends one of the configured prepaid calendar periods without month-end rollover. */
export function extendSubscriptionByMonths(paidUntil: Date | null, now: Date, periodMonths: number): Date {
  if (![1, 3, 6].includes(periodMonths)) throw new Error("invalid_subscription_period");
  const start = paidUntil !== null && paidUntil > now ? paidUntil : now;
  const result = new Date(start);
  const dayOfMonth = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + periodMonths);
  const finalDayOfMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(dayOfMonth, finalDayOfMonth));
  return result;
}
