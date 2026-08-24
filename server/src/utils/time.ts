/**
 * Time helpers for ChargeSense.
 *
 * Booking start/end are stored as real `Date` values (UTC instants) in MongoDB.
 * Charger availability is a daily wall-clock window ("06:00" → "23:00") which we
 * interpret in India Standard Time (IST, UTC+05:30, no daylight saving), per spec.
 */

export const IST_OFFSET_MINUTES = 5 * 60 + 30; // +05:30

/** Minutes since IST midnight for a given instant (0..1439). */
export function istMinutesOfDay(date: Date): number {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60_000;
  const ist = new Date(istMs);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

/** Parse "HH:mm" into minutes-of-day. Returns null for malformed input. */
export function parseHHmm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Format minutes-of-day as "HH:mm". */
export function formatHHmm(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap iff
 * aStart < bEnd AND aEnd > bStart. This is the canonical FCFS overlap test.
 */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

/**
 * True when the booking [start, end) fits entirely inside the charger's daily
 * IST availability window and does not span across midnight.
 */
export function isWithinDailyWindow(
  start: Date,
  end: Date,
  availableFrom: string,
  availableUntil: string,
): boolean {
  const from = parseHHmm(availableFrom);
  const until = parseHHmm(availableUntil);
  if (from === null || until === null) return false;

  const startMin = istMinutesOfDay(start);
  const endMinRaw = istMinutesOfDay(end);

  // Detect crossing IST midnight: end instant lands on a different IST day,
  // or the wall-clock end is not strictly after the wall-clock start.
  const startDay = istDayNumber(start);
  const endDay = istDayNumber(end);
  if (startDay !== endDay) return false;

  const endMin = endMinRaw;
  if (endMin <= startMin) return false;

  return startMin >= from && endMin <= until;
}

/** Integer IST day index (days since epoch in IST). */
export function istDayNumber(date: Date): number {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60_000;
  return Math.floor(istMs / 86_400_000);
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Compose the IST end-of-window instant for the same IST day as `ref`. */
export function istWindowEndForDay(ref: Date, availableUntil: string): Date | null {
  const until = parseHHmm(availableUntil);
  if (until === null) return null;
  const dayStartUtcMs = istDayNumber(ref) * 86_400_000 - IST_OFFSET_MINUTES * 60_000;
  return new Date(dayStartUtcMs + until * 60_000);
}
