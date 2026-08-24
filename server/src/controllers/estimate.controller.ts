import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { Validator } from '../validators/helpers';
import { CarModel } from '../models/CarModel';
import { Charger } from '../models/Charger';
import { ApiError } from '../utils/ApiError';
import { estimate } from '../services/estimator.service';

/**
 * Server-side charging estimate. Accepts either a chargerId (to pull
 * power/price) or explicit chargerPowerKW + pricePerKWh, plus a carModelId or
 * explicit batteryCapacityKWh. Returns energy / time / cost estimates.
 */
export const compute = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const parsed = new Validator(body)
    .number('currentBatteryPct', { min: 0, max: 100 })
    .number('targetBatteryPct', { min: 0, max: 100 })
    .done<{ currentBatteryPct: number; targetBatteryPct: number }>();

  let batteryCapacityKWh: number | undefined;
  let vehicleMaxPowerKW: number | undefined;
  if (body.carModelId) {
    const car = await CarModel.findById(body.carModelId).lean();
    if (!car) throw ApiError.badRequest('Vehicle not found', 'CAR_NOT_FOUND');
    batteryCapacityKWh = car.batteryCapacityKWh;
    vehicleMaxPowerKW = car.maxChargingPowerKW;
  } else if (body.batteryCapacityKWh) {
    batteryCapacityKWh = Number(body.batteryCapacityKWh);
  }
  if (!batteryCapacityKWh) {
    throw ApiError.badRequest('Provide carModelId or batteryCapacityKWh', 'MISSING_VEHICLE');
  }

  let chargerPowerKW: number | undefined;
  let pricePerKWh: number | undefined;
  if (body.chargerId) {
    const charger = await Charger.findById(body.chargerId).lean();
    if (!charger) throw ApiError.badRequest('Charger not found', 'CHARGER_NOT_FOUND');
    chargerPowerKW = charger.powerKW;
    pricePerKWh = charger.pricePerKWh;
  } else {
    chargerPowerKW = Number(body.chargerPowerKW);
    pricePerKWh = Number(body.pricePerKWh);
  }
  if (!chargerPowerKW || pricePerKWh === undefined || Number.isNaN(pricePerKWh)) {
    throw ApiError.badRequest('Provide chargerId or chargerPowerKW + pricePerKWh', 'MISSING_CHARGER');
  }

  if (parsed.targetBatteryPct <= parsed.currentBatteryPct) {
    throw ApiError.badRequest('Target battery must exceed current battery', 'INVALID_BATTERY_RANGE');
  }

  const result = estimate({
    batteryCapacityKWh,
    currentBatteryPct: parsed.currentBatteryPct,
    targetBatteryPct: parsed.targetBatteryPct,
    chargerPowerKW,
    vehicleMaxPowerKW,
    pricePerKWh,
  });
  return sendSuccess(res, result);
});
