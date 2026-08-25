import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import type { AuthedRequest } from '../middleware/types';
import { validateCreateCharger, validateUpdateCharger } from '../validators/charger.validators';
import {
  listChargers,
  getChargerById,
  createCharger,
  updateCharger,
  deleteCharger,
  type ChargerFilters,
} from '../services/charger.service';
import { getChargerAvailability } from '../services/booking.service';

function parseNum(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const filters: ChargerFilters = {
    city: typeof q.city === 'string' ? q.city : undefined,
    connectorType: typeof q.connectorType === 'string' ? q.connectorType : undefined,
    maxPrice: parseNum(q.maxPrice),
    minPower: parseNum(q.minPower),
    availableNow: q.availableNow === 'true',
    search: typeof q.search === 'string' ? q.search : undefined,
    sort: ['nearest', 'price', 'power', 'rating'].includes(q.sort as string)
      ? (q.sort as ChargerFilters['sort'])
      : undefined,
    lat: parseNum(q.lat),
    lng: parseNum(q.lng),
    radiusKm: parseNum(q.radiusKm),
  };
  const chargers = await listChargers(filters);
  return sendSuccess(res, { chargers, count: chargers.length });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const charger = await getChargerById(req.params.id);
  return sendSuccess(res, { charger });
});

export const availability = asyncHandler(async (req: Request, res: Response) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const data = await getChargerAvailability(req.params.id, date);
  return sendSuccess(res, data);
});

export const create = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const input = validateCreateCharger(req.body ?? {});
  const charger = await createCharger(req.user!.id, input as never);
  return sendSuccess(res, { charger }, 201);
});

export const update = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const input = validateUpdateCharger(req.body ?? {});
  const charger = await updateCharger(req.params.id, req.user!.id, input as never);
  return sendSuccess(res, { charger });
});

export const remove = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const result = await deleteCharger(req.params.id, req.user!.id);
  return sendSuccess(res, result);
});
