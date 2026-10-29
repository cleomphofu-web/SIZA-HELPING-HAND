export function isConfirmationLocked(input: { endedAt: Date; confirmedAt: Date | null; reportedAt: Date | null; now: Date; graceHours: number }): boolean {
  return input.confirmedAt === null && input.reportedAt === null && input.now.getTime() >= input.endedAt.getTime() + input.graceHours * 60 * 60 * 1000;
}
