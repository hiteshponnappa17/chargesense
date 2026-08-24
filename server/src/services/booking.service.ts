import { Types } from 'mongoose';
import { Booking, type BookingDoc } from '../models/Booking';
import { Charger } from '../models/Charger';
import { CarModel } from '../models/CarModel';
import { nextSequence } from '../models/Counter';
import { ApiError } from '../utils/ApiError';
import {
  isWithinDailyWindow,
  minutesBetween,
  IST_OFFSET_MINUTES,
} from '../utils/time';
import { estimate } from './estimator.service';
import {
  withChargerLock,
  findOverlappingConfirmed,
  findNextAvailableSlot,
  type TimeSlot,
} from './scheduler.service';

export interface CreateBookingInput {
  userId: string;
  chargerId: string;
  startTime: Date;
  endTime: Date;
  carModelId?: string | null;
  currentBatteryPct?: number | null;
  targetBatteryPct?: number | null;
  joinQueue?: boolean;
}

export type CreateBookingResult =
  | { outcome: 'confirmed'; booking: BookingDoc }
  | { outcome: 'pending'; booking: BookingDoc; conflict: TimeSlot; nextAvailableSlot: TimeSlot | null }
  | { outcome: 'conflict'; conflict: TimeSlot; nextAvailableSlot: TimeSlot | null };

const POPULATE_CHARGER = {
  path: 'chargerId',
  select: 'name address city connectorType powerKW pricePerKWh latitude longitude ownerId status',
};

async function makeBookingCode(): Promise<string> {
  const seq = await nextSequence('booking');
  const istNow = new Date(Date.now() + IST_OFFSET_MINUTES * 60_000);
  const year = istNow.getUTCFullYear();
  return `CS-${year}-${String(seq).padStart(6, '0')}`;
}

/** Deterministic FCFS tie-break: was `a` created strictly before `b`? */
function arrivedBefore(
  a: { requestedAt?: Date; createdAt?: Date; _id: Types.ObjectId },
  b: { requestedAt?: Date; createdAt?: Date; _id: Types.ObjectId },
): boolean {
  const at = new Date(a.requestedAt ?? a.createdAt ?? 0).getTime();
  const bt = new Date(b.requestedAt ?? b.createdAt ?? 0).getTime();
  if (at !== bt) return at < bt;
  return a._id.toString() < b._id.toString();
}

/**
 * Create a booking through the FCFS scheduler.
 * Validation errors throw ApiError. Slot conflicts are returned as data so the
 * controller can format the spec's conflict envelope (with nextAvailableSlot).
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const charger = await Charger.findById(input.chargerId);
  if (!charger) throw ApiError.notFound('Charger not found', 'CHARGER_NOT_FOUND');

  if (charger.status !== 'active') {
    throw ApiError.conflict(
      `This charger is currently ${charger.status} and not accepting bookings.`,
      'CHARGER_UNAVAILABLE',
    );
  }

  const start = input.startTime;
  const end = input.endTime;

  if (end.getTime() <= start.getTime()) {
    throw ApiError.badRequest('End time must be after start time', 'INVALID_TIME_RANGE');
  }
  const durationMinutes = minutesBetween(start, end);
  if (durationMinutes < 15) {
    throw ApiError.badRequest('Minimum booking duration is 15 minutes', 'DURATION_TOO_SHORT');
  }
  if (durationMinutes > 720) {
    throw ApiError.badRequest('Maximum booking duration is 12 hours', 'DURATION_TOO_LONG');
  }
  // Cannot book in the past (allow a 2-minute grace for clock skew).
  if (start.getTime() < Date.now() - 2 * 60_000) {
    throw ApiError.badRequest('Start time cannot be in the past', 'START_IN_PAST');
  }

  if (!isWithinDailyWindow(start, end, charger.availableFrom, charger.availableUntil)) {
    throw ApiError.badRequest(
      `Booking must fall within the charger's daily availability (${charger.availableFrom}–${charger.availableUntil} IST) and cannot span midnight.`,
      'OUTSIDE_AVAILABILITY',
      { availableFrom: charger.availableFrom, availableUntil: charger.availableUntil },
    );
  }

  // ---- Estimate energy / cost ----
  let carModel = null;
  if (input.carModelId) {
    carModel = await CarModel.findById(input.carModelId).lean();
    if (!carModel) throw ApiError.badRequest('Selected vehicle not found', 'CAR_NOT_FOUND');
  }

  let estimatedEnergyKWh: number;
  let estimatedCost: number;
  let chargingTimeMinutes: number;

  if (carModel && input.currentBatteryPct != null && input.targetBatteryPct != null) {
    if (input.targetBatteryPct <= input.currentBatteryPct) {
      throw ApiError.badRequest(
        'Target battery must be greater than current battery',
        'INVALID_BATTERY_RANGE',
      );
    }
    const result = estimate({
      batteryCapacityKWh: carModel.batteryCapacityKWh,
      currentBatteryPct: input.currentBatteryPct,
      targetBatteryPct: input.targetBatteryPct,
      chargerPowerKW: charger.powerKW,
      vehicleMaxPowerKW: carModel.maxChargingPowerKW,
      pricePerKWh: charger.pricePerKWh,
    });
    estimatedEnergyKWh = result.requiredEnergyKWh;
    estimatedCost = result.estimatedCost;
    chargingTimeMinutes = result.chargingTimeMinutes;
  } else {
    // Fallback: energy the charger could deliver across the reserved slot.
    const effPower = carModel
      ? Math.min(charger.powerKW, carModel.maxChargingPowerKW)
      : charger.powerKW;
    estimatedEnergyKWh = Math.round(effPower * (durationMinutes / 60) * 100) / 100;
    estimatedCost = Math.round(estimatedEnergyKWh * charger.pricePerKWh * 100) / 100;
    chargingTimeMinutes = durationMinutes;
  }

  // ---- Critical section: conflict check + insert, serialized per charger ----
  return withChargerLock(String(charger._id), async () => {
    const overlaps = await findOverlappingConfirmed(charger._id, start, end);

    if (overlaps.length === 0) {
      const bookingCode = await makeBookingCode();
      const booking = await Booking.create({
        bookingCode,
        userId: new Types.ObjectId(input.userId),
        chargerId: charger._id,
        carModelId: input.carModelId ? new Types.ObjectId(input.carModelId) : null,
        startTime: start,
        endTime: end,
        durationMinutes,
        currentBatteryPct: input.currentBatteryPct ?? null,
        targetBatteryPct: input.targetBatteryPct ?? null,
        estimatedEnergyKWh,
        estimatedCost,
        chargingTimeMinutes,
        status: 'confirmed',
        queuePosition: 1,
        requestedAt: new Date(),
      });

      // Defensive cross-process re-check (see scheduler.service header note).
      const dupes = await findOverlappingConfirmed(charger._id, start, end, booking._id);
      const weLose = dupes.some((d) => arrivedBefore(d as never, booking));
      if (weLose) {
        await Booking.deleteOne({ _id: booking._id });
        const nextAvailableSlot = await findNextAvailableSlot(charger, start, durationMinutes);
        return { outcome: 'conflict', conflict: { startTime: start, endTime: end }, nextAvailableSlot };
      }

      return { outcome: 'confirmed', booking };
    }

    // Conflict path
    const conflict: TimeSlot = {
      startTime: new Date(overlaps[0].startTime),
      endTime: new Date(overlaps[0].endTime),
    };
    const nextAvailableSlot = await findNextAvailableSlot(charger, start, durationMinutes);

    if (input.joinQueue) {
      const pendingAhead = await Booking.countDocuments({
        chargerId: charger._id,
        status: 'pending',
        startTime: { $lt: end },
        endTime: { $gt: start },
      });
      const bookingCode = await makeBookingCode();
      const booking = await Booking.create({
        bookingCode,
        userId: new Types.ObjectId(input.userId),
        chargerId: charger._id,
        carModelId: input.carModelId ? new Types.ObjectId(input.carModelId) : null,
        startTime: start,
        endTime: end,
        durationMinutes,
        currentBatteryPct: input.currentBatteryPct ?? null,
        targetBatteryPct: input.targetBatteryPct ?? null,
        estimatedEnergyKWh,
        estimatedCost,
        chargingTimeMinutes,
        status: 'pending',
        queuePosition: pendingAhead + 1,
        requestedAt: new Date(),
      });
      return { outcome: 'pending', booking, conflict, nextAvailableSlot };
    }

    return { outcome: 'conflict', conflict, nextAvailableSlot };
  });
}

/**
 * Cancel a booking owned by `userId`. On cancelling a confirmed slot we
 * re-evaluate the pending queue (FCFS) so a freed slot can be claimed.
 */
export async function cancelBooking(bookingId: string, userId: string): Promise<BookingDoc> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
  if (String(booking.userId) !== String(userId)) {
    throw ApiError.forbidden('You can only cancel your own bookings');
  }
  if (!['confirmed', 'pending'].includes(booking.status)) {
    throw ApiError.badRequest(
      `A ${booking.status} booking cannot be cancelled`,
      'NOT_CANCELLABLE',
    );
  }
  if (booking.startTime.getTime() < Date.now()) {
    throw ApiError.badRequest('Past or in-progress bookings cannot be cancelled', 'NOT_CANCELLABLE');
  }

  const chargerId = String(booking.chargerId);
  return withChargerLock(chargerId, async () => {
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    await reprocessQueue(chargerId);
    return booking;
  });
}

/**
 * Promote pending bookings to confirmed in FCFS (arrival) order, wherever the
 * freed schedule now allows a conflict-free confirmation.
 */
export async function reprocessQueue(chargerId: string): Promise<number> {
  const charger = await Charger.findById(chargerId).lean();
  if (!charger || charger.status !== 'active') return 0;

  const pendings = await Booking.find({ chargerId, status: 'pending' })
    .sort({ requestedAt: 1, _id: 1 })
    .exec();

  let promoted = 0;
  for (const p of pendings) {
    if (!isWithinDailyWindow(p.startTime, p.endTime, charger.availableFrom, charger.availableUntil)) {
      continue;
    }
    const overlaps = await findOverlappingConfirmed(chargerId, p.startTime, p.endTime, p._id);
    if (overlaps.length === 0) {
      p.status = 'confirmed';
      p.queuePosition = 1;
      await p.save();
      promoted += 1;
    }
  }
  return promoted;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getUserBookings(userId: string, status?: string) {
  const query: Record<string, unknown> = { userId };
  if (status) query.status = status;
  return Booking.find(query)
    .populate(POPULATE_CHARGER)
    .populate({ path: 'carModelId', select: 'brand model batteryCapacityKWh' })
    .sort({ startTime: -1 })
    .lean();
}

export async function getBookingById(bookingId: string, requesterId: string) {
  const booking = await Booking.findById(bookingId)
    .populate(POPULATE_CHARGER)
    .populate({ path: 'carModelId', select: 'brand model batteryCapacityKWh maxChargingPowerKW' })
    .populate({ path: 'userId', select: 'name email phone' })
    .lean();
  if (!booking) throw ApiError.notFound('Booking not found', 'BOOKING_NOT_FOUND');

  const charger = booking.chargerId as unknown as { ownerId?: Types.ObjectId } | null;
  const isOwnerDriver = String((booking.userId as { _id?: Types.ObjectId })?._id ?? booking.userId) === String(requesterId);
  const isHostOfCharger = charger?.ownerId && String(charger.ownerId) === String(requesterId);

  if (!isOwnerDriver && !isHostOfCharger) {
    throw ApiError.forbidden('You do not have access to this booking');
  }
  return booking;
}

export async function getHostBookings(hostId: string, status?: string) {
  const chargers = await Charger.find({ ownerId: hostId }).select('_id').lean();
  const chargerIds = chargers.map((c) => c._id);
  const query: Record<string, unknown> = { chargerId: { $in: chargerIds } };
  if (status) query.status = status;
  return Booking.find(query)
    .populate(POPULATE_CHARGER)
    .populate({ path: 'userId', select: 'name email phone' })
    .sort({ startTime: -1 })
    .lean();
}

/** Availability view for a charger on a given IST day (busy slots + window). */
export async function getChargerAvailability(chargerId: string, dateISO?: string) {
  const charger = await Charger.findById(chargerId).lean();
  if (!charger) throw ApiError.notFound('Charger not found', 'CHARGER_NOT_FOUND');

  const ref = dateISO ? new Date(dateISO) : new Date();
  // Compute IST day bounds for `ref`.
  const istMs = ref.getTime() + IST_OFFSET_MINUTES * 60_000;
  const dayStartIstMs = Math.floor(istMs / 86_400_000) * 86_400_000;
  const from = new Date(dayStartIstMs - IST_OFFSET_MINUTES * 60_000);
  const to = new Date(from.getTime() + 86_400_000);

  const busy = await Booking.find({
    chargerId,
    status: 'confirmed',
    startTime: { $lt: to },
    endTime: { $gt: from },
  })
    .sort({ startTime: 1 })
    .select('startTime endTime durationMinutes')
    .lean();

  return {
    chargerId,
    date: from.toISOString(),
    availableFrom: charger.availableFrom,
    availableUntil: charger.availableUntil,
    status: charger.status,
    busySlots: busy.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
  };
}
