import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import type { AuthedRequest } from '../middleware/types';
import { getDriverDashboard } from '../services/dashboard.service';

export const driver = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = await getDriverDashboard(req.user!.id);
  return sendSuccess(res, data);
});
