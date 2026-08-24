import { Validator } from './helpers';

export interface CreateBookingBody {
  chargerId: string;
  startTime: Date;
  endTime: Date;
  carModelId?: string;
  currentBatteryPct?: number;
  targetBatteryPct?: number;
  joinQueue?: boolean;
}

export function validateCreateBooking(body: Record<string, unknown>): CreateBookingBody {
  const v = new Validator(body)
    .string('chargerId')
    .isoDate('startTime')
    .isoDate('endTime')
    .boolean('joinQueue');

  if (body.carModelId !== undefined && body.carModelId !== '') v.string('carModelId');
  if (body.currentBatteryPct !== undefined && body.currentBatteryPct !== '') {
    v.number('currentBatteryPct', { min: 0, max: 100 });
  }
  if (body.targetBatteryPct !== undefined && body.targetBatteryPct !== '') {
    v.number('targetBatteryPct', { min: 0, max: 100 });
  }
  return v.done<CreateBookingBody>();
}
