import { apiGet } from '@/lib/api';
import type { Booking, HostCharger, HostDashboard } from '@/types';

export async function getHostDashboard(): Promise<HostDashboard> {
  return apiGet<HostDashboard>('/host/dashboard');
}

export async function getHostChargers(): Promise<HostCharger[]> {
  const { chargers } = await apiGet<{ chargers: HostCharger[]; count: number }>('/host/chargers');
  return chargers;
}

export async function getHostBookings(status?: string): Promise<Booking[]> {
  const q = status ? `?status=${status}` : '';
  const { bookings } = await apiGet<{ bookings: Booking[]; count: number }>(`/host/bookings${q}`);
  return bookings;
}
