import { Validator } from './helpers';
import { CONNECTOR_TYPES, AMENITIES } from '../utils/constants';
import { parseHHmm } from '../utils/time';
import { ApiError } from '../utils/ApiError';

export interface ChargerInput {
  name: string;
  description?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  connectorType: string;
  powerKW: number;
  pricePerKWh: number;
  availableFrom: string;
  availableUntil: string;
  amenities: string[];
}

function assertWindowOrder(from: string, until: string) {
  const f = parseHHmm(from);
  const u = parseHHmm(until);
  if (f !== null && u !== null && u <= f) {
    throw ApiError.badRequest('Available Until must be later than Available From', 'VALIDATION_ERROR', [
      { path: 'availableUntil', message: 'Must be later than Available From' },
    ]);
  }
}

export function validateCreateCharger(body: Record<string, unknown>): ChargerInput {
  const data = new Validator(body)
    .string('name', { min: 2, max: 80 })
    .string('description', { required: false, max: 500 })
    .string('address', { min: 3, max: 160 })
    .string('city', { min: 2, max: 60 })
    .number('latitude', { min: -90, max: 90 })
    .number('longitude', { min: -180, max: 180 })
    .enum('connectorType', CONNECTOR_TYPES)
    .number('powerKW', { min: 0.1, max: 400 })
    .number('pricePerKWh', { min: 0, max: 1000 })
    .hhmm('availableFrom')
    .hhmm('availableUntil')
    .stringArray('amenities', AMENITIES)
    .done<ChargerInput>();
  assertWindowOrder(data.availableFrom, data.availableUntil);
  return data;
}

export function validateUpdateCharger(body: Record<string, unknown>): Partial<ChargerInput> {
  const v = new Validator(body)
    .string('name', { required: false, min: 2, max: 80 })
    .string('description', { required: false, max: 500 })
    .string('address', { required: false, min: 3, max: 160 })
    .string('city', { required: false, min: 2, max: 60 })
    .number('latitude', { required: false, min: -90, max: 90 })
    .number('longitude', { required: false, min: -180, max: 180 })
    .number('powerKW', { required: false, min: 0.1, max: 400 })
    .number('pricePerKWh', { required: false, min: 0, max: 1000 });
  if (body.connectorType !== undefined) v.enum('connectorType', CONNECTOR_TYPES);
  if (body.availableFrom !== undefined) v.hhmm('availableFrom');
  if (body.availableUntil !== undefined) v.hhmm('availableUntil');
  if (body.amenities !== undefined) v.stringArray('amenities', AMENITIES);
  if (body.status !== undefined) v.enum('status', ['active', 'inactive', 'maintenance'] as const);
  const data = v.done<Partial<ChargerInput> & { availableFrom?: string; availableUntil?: string }>();
  if (data.availableFrom && data.availableUntil) assertWindowOrder(data.availableFrom, data.availableUntil);
  return data;
}
