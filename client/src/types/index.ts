// ---------------------------------------------------------------------------
// Shared API types — mirror the server's response shapes (see server/src).
// ---------------------------------------------------------------------------

export type Role = 'driver' | 'host';
export type ConnectorType = 'Type 2' | 'CCS' | 'CHAdeMO';
export type ChargerStatus = 'active' | 'inactive' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';
export type Amenity =
  | 'Parking'
  | 'Covered'
  | 'Security Camera'
  | '24/7 Access'
  | 'Wi-Fi'
  | 'Restroom'
  | 'Cafe';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  defaultCarModelId: string | null;
  vehicleRegistration: string | null;
  createdAt: string;
}

export interface CarModel {
  _id: string;
  brand: string;
  model: string;
  batteryCapacityKWh: number;
  supportedConnectors: ConnectorType[];
  maxChargingPowerKW: number;
  rangeKm: number;
  imageColor: string;
}

/** Owner reference: a plain id, or populated with public fields. */
export interface ChargerOwner {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

export interface Charger {
  _id: string;
  ownerId: string | ChargerOwner;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  connectorType: ConnectorType;
  powerKW: number;
  pricePerKWh: number;
  availableFrom: string;
  availableUntil: string;
  amenities: Amenity[];
  status: ChargerStatus;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  // Added by the list/detail services:
  isOpenNow?: boolean;
  distanceKm?: number | null;
}

/** Host charger list rows carry booking/earnings rollups. */
export interface HostCharger extends Charger {
  bookingCount: number;
  confirmedCount: number;
  completedCount: number;
  estimatedEarnings: number;
}

export interface PopulatedCarRef {
  _id: string;
  brand: string;
  model: string;
  batteryCapacityKWh: number;
  maxChargingPowerKW?: number;
}

export interface PopulatedUserRef {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Booking {
  _id: string;
  bookingCode: string;
  userId: string | PopulatedUserRef;
  chargerId: string | Charger;
  carModelId: string | PopulatedCarRef | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  currentBatteryPct: number | null;
  targetBatteryPct: number | null;
  estimatedEnergyKWh: number;
  estimatedCost: number;
  chargingTimeMinutes: number | null;
  status: BookingStatus;
  queuePosition: number | null;
  requestedAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface EstimatorResult {
  requiredEnergyKWh: number;
  effectivePowerKW: number;
  chargingTimeHours: number;
  chargingTimeMinutes: number;
  estimatedCost: number;
}

export interface Availability {
  chargerId: string;
  date: string;
  availableFrom: string;
  availableUntil: string;
  status: ChargerStatus;
  busySlots: TimeSlot[];
}

// ---- Booking creation outcomes ----
export interface BookingConfirmedResult {
  outcome: 'confirmed';
  booking: Booking;
}
export interface BookingPendingResult {
  outcome: 'pending';
  booking: Booking;
  conflict: TimeSlot;
  nextAvailableSlot: TimeSlot | null;
}
export interface BookingConflictResult {
  outcome: 'conflict';
  conflict: TimeSlot;
  nextAvailableSlot: TimeSlot | null;
}
export type BookingResult =
  | BookingConfirmedResult
  | BookingPendingResult
  | BookingConflictResult;

// ---- Dashboards ----
export interface DriverDashboard {
  stats: {
    availableChargers: number;
    upcomingBookings: number;
    totalBookings: number;
    completedBookings: number;
    estimatedSpend: number;
  };
  nextBooking: Booking | null;
  recentActivity: {
    id: string;
    type: BookingStatus;
    bookingCode: string;
    chargerName: string;
    at: string;
    amount: number;
  }[];
}

export interface HostWeekPoint {
  day: string;
  date: string;
  bookings: number;
  earnings: number;
}
export interface HostUtilPoint {
  chargerId: string;
  name: string;
  utilizationPct: number;
}
export interface HostDashboard {
  stats: {
    activeChargers: number;
    totalChargers: number;
    todaysBookings: number;
    monthlyEarnings: number;
    totalEarnings: number;
    utilization: number;
    totalBookings: number;
  };
  charts: {
    week: HostWeekPoint[];
    utilization: HostUtilPoint[];
  };
  recentBookings: {
    id: string;
    bookingCode: string;
    driverName: string;
    chargerName: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    estimatedCost: number;
  }[];
}

export interface ChargerFormValues {
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  connectorType: ConnectorType;
  powerKW: number;
  pricePerKWh: number;
  availableFrom: string;
  availableUntil: string;
  amenities: Amenity[];
  status?: ChargerStatus;
}
