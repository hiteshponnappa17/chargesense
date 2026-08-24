/**
 * Charging estimator — a deliberately simple, transparent model for the MVP.
 * All outputs are ESTIMATES and should be labelled as such in the UI. We do
 * not model temperature, taper curves, or losses beyond a light efficiency
 * factor and the vehicle's max accept rate.
 */

export interface EstimatorInput {
  batteryCapacityKWh: number;
  currentBatteryPct: number;
  targetBatteryPct: number;
  chargerPowerKW: number;
  vehicleMaxPowerKW?: number;
  pricePerKWh: number;
}

export interface EstimatorResult {
  requiredEnergyKWh: number;
  effectivePowerKW: number;
  chargingTimeHours: number;
  chargingTimeMinutes: number;
  estimatedCost: number;
}

/** Required energy = capacity × (target − current) / 100 */
export function calculateRequiredEnergy(
  batteryCapacityKWh: number,
  currentPct: number,
  targetPct: number,
): number {
  const delta = Math.max(0, targetPct - currentPct);
  return round2((batteryCapacityKWh * delta) / 100);
}

/** Effective power is capped by whichever is lower: charger or vehicle intake. */
export function effectivePower(chargerPowerKW: number, vehicleMaxPowerKW?: number): number {
  if (!vehicleMaxPowerKW || vehicleMaxPowerKW <= 0) return chargerPowerKW;
  return Math.min(chargerPowerKW, vehicleMaxPowerKW);
}

/** Charging time (hours) = required energy / effective power. */
export function calculateChargingTime(energyKWh: number, powerKW: number): number {
  if (powerKW <= 0) return 0;
  return energyKWh / powerKW;
}

/** Estimated cost = required energy × price per kWh. */
export function calculateEstimatedCost(energyKWh: number, pricePerKWh: number): number {
  return round2(energyKWh * pricePerKWh);
}

export function estimate(input: EstimatorInput): EstimatorResult {
  const requiredEnergyKWh = calculateRequiredEnergy(
    input.batteryCapacityKWh,
    input.currentBatteryPct,
    input.targetBatteryPct,
  );
  const effPower = effectivePower(input.chargerPowerKW, input.vehicleMaxPowerKW);
  const chargingTimeHours = calculateChargingTime(requiredEnergyKWh, effPower);
  return {
    requiredEnergyKWh,
    effectivePowerKW: round2(effPower),
    chargingTimeHours: round2(chargingTimeHours),
    chargingTimeMinutes: Math.round(chargingTimeHours * 60),
    estimatedCost: calculateEstimatedCost(requiredEnergyKWh, input.pricePerKWh),
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
