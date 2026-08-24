import { apiPost } from '@/lib/api';
import type { EstimatorResult } from '@/types';

export interface EstimateInput {
  carModelId?: string;
  batteryCapacityKWh?: number;
  chargerId?: string;
  chargerPowerKW?: number;
  pricePerKWh?: number;
  currentBatteryPct: number;
  targetBatteryPct: number;
}

export async function computeEstimate(input: EstimateInput): Promise<EstimatorResult> {
  return apiPost<EstimatorResult>('/estimate', input);
}
