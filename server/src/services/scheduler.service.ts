import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import type { ChargerDoc } from '../models/Charger';
import {
  intervalsOverlap,
  parseHHmm,
  minutesBetween,
  IST_OFFSET_MINUTES,
  istDayNumber,
} from '../utils/time';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

/**
 * ---------------------------------------------------------------------------
 * FCFS SCHEDULER
 * ---------------------------------------------------------------------------
 * The backend is the single source of truth for conflict-free scheduling.
 *
 * Concurrency model:
 *   - Node is single-threaded, but `await` points interleave requests. To keep
 *     "check overlap -> insert" atomic *within this process*, every mutation
 *     for a given charger runs inside a per-charger async lock (serialized).
 *   - As defense against multiple server processes, createBooking also does a
 *     post-insert re-check and rolls back if an earlier-arriving booking won
 *     the same window (see booking.service).
 *   - This is deliberately structured so it can later be upgraded to a MongoDB
 *     multi-document transaction without touching call sites.
 */

const chargerTails = new Map<string, Promise<unknown>>();

/** Serialize async work per charger id (simple promise-chain mutex). */
export function withChargerLock<T>(chargerId: string, fn: () => Promise<T>): Promise<T> {
  const prev = chargerTails.get(chargerId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  // Swallow result/errors on the stored tail so the chain never breaks.
  chargerTails.set(
    chargerId,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

/** Confirmed bookings for a charger overlapping [start, end), optionally excluding one id. */
export async function findOverlappingConfirmed(
  chargerId: Types.ObjectId | string,
  start: Date,
  end: Date,
  excludeBookingId?: Types.ObjectId | string,
) {
  const query: Record<string, unknown> = {
    chargerId,
    status: 'confirmed',
    // Overlap: existing.start < requested.end AND existing.end > requested.start
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  return Booking.find(query).sort({ startTime: 1 }).lean();
}

/** Convenience boolean overlap check (kept for readability / tests). */
export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return intervalsOverlap(a.startTime, a.endTime, b.startTime, b.endTime);
}

function windowInstantsForDay(dayNumber: number, fromMin: number, untilMin: number): TimeSlot {
  const dayStartUtcMs = dayNumber * 86_400_000 - IST_OFFSET_MINUTES * 60_000;
  return {
    startTime: new Date(dayStartUtcMs + fromMin * 60_000),
    endTime: new Date(dayStartUtcMs + untilMin * 60_000),
  };
}

/**
 * Find the earliest available slot of `durationMinutes` at or after
 * `desiredStart`, respecting the charger's daily IST availability window and
 * all confirmed bookings. Searches up to `maxDays` forward. Returns null if
 * nothing fits in that horizon.
 */
export async function findNextAvailableSlot(
  charger: Pick<ChargerDoc, 'availableFrom' | 'availableUntil'> & { _id: Types.ObjectId },
  desiredStart: Date,
  durationMinutes: number,
  maxDays = 14,
): Promise<TimeSlot | null> {
  const fromMin = parseHHmm(charger.availableFrom);
  const untilMin = parseHHmm(charger.availableUntil);
  if (fromMin === null || untilMin === null || untilMin <= fromMin) return null;
  const durationMs = durationMinutes * 60_000;

  const startDay = istDayNumber(desiredStart);

  for (let offset = 0; offset < maxDays; offset += 1) {
    const day = startDay + offset;
    const win = windowInstantsForDay(day, fromMin, untilMin);

    // Lower bound: for the first day, the requested time; later days, window start.
    let cursor = offset === 0 ? new Date(Math.max(desiredStart.getTime(), win.startTime.getTime())) : win.startTime;

    if (cursor.getTime() + durationMs > win.endTime.getTime()) continue;

    const dayBookings = await Booking.find({
      chargerId: charger._id,
      status: 'confirmed',
      startTime: { $lt: win.endTime },
      endTime: { $gt: win.startTime },
    })
      .sort({ startTime: 1 })
      .lean();

    let fits = true;
    for (const b of dayBookings) {
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      if (bEnd <= cursor.getTime()) continue; // already past cursor
      if (bStart >= cursor.getTime() + durationMs) break; // free gap found before this booking
      // Overlap — jump the cursor to the end of this booking.
      cursor = new Date(Math.max(cursor.getTime(), bEnd));
      if (cursor.getTime() + durationMs > win.endTime.getTime()) {
        fits = false;
        break;
      }
    }

    if (fits && cursor.getTime() + durationMs <= win.endTime.getTime()) {
      return { startTime: cursor, endTime: new Date(cursor.getTime() + durationMs) };
    }
  }

  return null;
}

/** Busy (confirmed) slots for a charger between [from, to). */
export async function getBusySlots(chargerId: Types.ObjectId | string, from: Date, to: Date) {
  const rows = await Booking.find({
    chargerId,
    status: 'confirmed',
    startTime: { $lt: to },
    endTime: { $gt: from },
  })
    .sort({ startTime: 1 })
    .select('startTime endTime durationMinutes')
    .lean();
  return rows.map((r) => ({
    startTime: r.startTime,
    endTime: r.endTime,
    durationMinutes: r.durationMinutes ?? minutesBetween(new Date(r.startTime), new Date(r.endTime)),
  }));
}
