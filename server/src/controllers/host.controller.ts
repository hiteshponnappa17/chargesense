import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import type { AuthedRequest } from '../middleware/types';
import { getHostBookings } from '../services/booking.service';
import { getHostChargers } from '../services/charger.service';
import { getHostDashboard } from '../services/dashboard.service';

export const dashboard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = await getHostDashboard(req.user!.id);
  return sendSuccess(res, data);
});

export const chargers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const rows = await getHostChargers(req.user!.id);
  return sendSuccess(res, { chargers: rows, count: rows.length });
});

export const bookings = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const rows = await getHostBookings(req.user!.id, status);
  return sendSuccess(res, { bookings: rows, count: rows.length });
});
