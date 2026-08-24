import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { CarModel } from '../models/CarModel';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const cars = await CarModel.find().sort({ brand: 1, model: 1 }).lean();
  return sendSuccess(res, { cars, count: cars.length });
});
