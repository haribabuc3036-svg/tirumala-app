/**
 * Given an array of ISO booking date strings (one per month / per slot),
 * returns the single "active" date the app should act on right now.
 *
 * Priority order:
 *   1. The nearest FUTURE date  → show countdown to it.
 *   2. A date that passed within the last 24 h → show "Booking is Open".
 *   3. If all dates are > 24 h in the past → returns null (hide the service).
 */
export function resolveActiveBookingDate(
  dates: string[] | null | undefined
): string | null {
  if (!dates || dates.length === 0) return null;

  const now = Date.now();
  const MS_24H = 86_400_000;

  // Sort ascending by time
  const sorted = [...dates]
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  // 1. First upcoming date
  const upcoming = sorted.find((t) => t > now);
  if (upcoming !== undefined) return new Date(upcoming).toISOString();

  // 2. Most-recent past date still within 24 h window (last in sorted array)
  const latest = sorted[sorted.length - 1];
  if (now - latest < MS_24H) return new Date(latest).toISOString();

  return null;
}

/**
 * Returns true when the resolved booking date has already passed
 * (i.e. booking is currently open, within the 24-hour window).
 */
export function isBookingOpen(resolvedISO: string): boolean {
  return new Date(resolvedISO).getTime() <= Date.now();
}
