import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import type { AuthedRequest } from '../middleware/types';
import { validateCreateBooking } from '../validators/booking.validators';
import {
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingById,
} from '../services/booking.service';

export const create = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const input = validateCreateBooking(req.body ?? {});
  const result = await createBooking({
    userId: req.user!.id,
    chargerId: input.chargerId,
    startTime: input.startTime,
    endTime: input.endTime,
    carModelId: input.carModelId ?? null,
    currentBatteryPct: input.currentBatteryPct ?? null,
    targetBatteryPct: input.targetBatteryPct ?? null,
    joinQueue: input.joinQueue ?? false,
  });

  if (result.outcome === 'confirmed') {
    return sendSuccess(res, { booking: result.booking, status: 'confirmed' }, 201);
  }

  if (result.outcome === 'pending') {
    return sendSuccess(
      res,
      {
        booking: result.booking,
        status: 'pending',
        conflict: result.conflict,
        nextAvailableSlot: result.nextAvailableSlot,
      },
      202,
    );
  }

  // Conflict — match the documented conflict envelope (spec §32).
  return res.status(409).json({
    success: false,
    code: 'BOOKING_CONFLICT',
    message: 'The requested charging slot is unavailable.',
    conflict: result.conflict,
    nextAvailableSlot: result.nextAvailableSlot,
  });
});

export const list = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const bookings = await getUserBookings(req.user!.id, status);
  return sendSuccess(res, { bookings, count: bookings.length });
});

export const getOne = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const booking = await getBookingById(req.params.id, req.user!.id);
  return sendSuccess(res, { booking });
});

export const cancel = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const booking = await cancelBooking(req.params.id, req.user!.id);
  return sendSuccess(res, { booking, status: booking.status });
});
