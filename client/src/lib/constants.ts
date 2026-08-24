import type { ConnectorType, Amenity, BookingStatus, ChargerStatus } from '@/types';

export const CONNECTOR_TYPES: ConnectorType[] = ['Type 2', 'CCS', 'CHAdeMO'];

export const POWER_LEVELS = [3.3, 7.4, 11, 22, 50];

export const AMENITIES: Amenity[] = [
  'Parking',
  'Covered',
  'Security Camera',
  '24/7 Access',
  'Wi-Fi',
  'Restroom',
  'Cafe',
];

/** Short descriptor + accent used across connector chips/legends. */
export const CONNECTOR_META: Record<ConnectorType, { label: string; blurb: string; color: string }> = {
  'Type 2': { label: 'Type 2', blurb: 'AC · common for home/destination charging', color: '#0ea5e9' },
  CCS: { label: 'CCS', blurb: 'DC fast charging', color: '#16a34a' },
  CHAdeMO: { label: 'CHAdeMO', blurb: 'DC fast charging (legacy)', color: '#8b5cf6' },
};

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'slate' }
> = {
  confirmed: { label: 'Confirmed', tone: 'green' },
  pending: { label: 'Waitlisted', tone: 'amber' },
  completed: { label: 'Completed', tone: 'blue' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
  rejected: { label: 'Rejected', tone: 'red' },
};

export const CHARGER_STATUS_META: Record<
  ChargerStatus,
  { label: string; tone: 'green' | 'amber' | 'slate' }
> = {
  active: { label: 'Active', tone: 'green' },
  maintenance: { label: 'Maintenance', tone: 'amber' },
  inactive: { label: 'Disabled', tone: 'slate' },
};

/** Speed tiering for a friendly "Fast / Rapid / Standard" label. */
export function chargerSpeedTier(powerKW: number): { label: string; tone: 'green' | 'blue' | 'slate' } {
  if (powerKW >= 50) return { label: 'Rapid', tone: 'green' };
  if (powerKW >= 22) return { label: 'Fast', tone: 'blue' };
  return { label: 'Standard', tone: 'slate' };
}

export const BATTERY_PRESETS = [
  { label: '20 → 80%', current: 20, target: 80 },
  { label: '30 → 100%', current: 30, target: 100 },
  { label: '50 → 90%', current: 50, target: 90 },
  { label: '10 → 60%', current: 10, target: 60 },
];

export const DEMO_CREDENTIALS = [
  { role: 'Driver', email: 'driver@example.com', password: 'password123' },
  { role: 'Host', email: 'host@example.com', password: 'password123' },
];
