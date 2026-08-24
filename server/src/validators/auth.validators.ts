import { Validator } from './helpers';
import { ROLES } from '../utils/constants';

export function validateRegister(body: Record<string, unknown>) {
  return new Validator(body)
    .string('name', { min: 2, max: 80 })
    .email('email')
    .phone('phone')
    .string('password', { min: 6, max: 100, trim: false })
    .enum('role', ROLES)
    .done<{ name: string; email: string; phone: string; password: string; role: 'driver' | 'host' }>();
}

export function validateLogin(body: Record<string, unknown>) {
  return new Validator(body)
    .email('email')
    .string('password', { trim: false })
    .done<{ email: string; password: string }>();
}

export function validateUpdateProfile(body: Record<string, unknown>) {
  const v = new Validator(body).string('name', { required: false, min: 2, max: 80 });
  if (body.phone !== undefined && body.phone !== '') v.phone('phone');
  v.string('vehicleRegistration', { required: false, max: 20 });
  v.string('defaultCarModelId', { required: false });
  return v.done<{
    name?: string;
    phone?: string;
    vehicleRegistration?: string;
    defaultCarModelId?: string;
  }>();
}
