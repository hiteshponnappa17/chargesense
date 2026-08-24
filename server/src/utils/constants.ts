export const ROLES = ['driver', 'host'] as const;
export type Role = (typeof ROLES)[number];

export const CONNECTOR_TYPES = ['Type 2', 'CCS', 'CHAdeMO'] as const;
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

export const CHARGER_STATUSES = ['active', 'inactive', 'maintenance'] as const;
export type ChargerStatus = (typeof CHARGER_STATUSES)[number];

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'cancelled',
  'rejected',
  'completed',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const AMENITIES = [
  'Parking',
  'Covered',
  'Security Camera',
  '24/7 Access',
  'Wi-Fi',
  'Restroom',
  'Cafe',
] as const;
export type Amenity = (typeof AMENITIES)[number];

/** Power levels commonly used across the demo dataset. */
export const POWER_LEVELS = [3.3, 7.4, 11, 22, 50] as const;
