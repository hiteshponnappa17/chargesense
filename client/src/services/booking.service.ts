import { ApiClientError, apiGet, apiPatch, http } from '@/lib/api';
import type { Booking, BookingResult, BookingStatus } from '@/types';

export interface CreateBookingPayload {
  chargerId: string;
  startTime: string;
  endTime: string;
  carModelId?: string | null;
  currentBatteryPct?: number | null;
  targetBatteryPct?: number | null;
  joinQueue?: boolean;
}

/**
 * Create a booking. The backend is the source of truth for FCFS conflicts:
 *   201 → confirmed, 202 → pending (queued), 409 BOOKING_CONFLICT → conflict.
 * We translate all three into a discriminated `BookingResult`.
 */
export async function createBooking(payload: CreateBookingPayload): Promise<BookingResult> {
  try {
    const res = await http.post('/bookings', payload);
    const data = res.data.data;
    if (data.status === 'pending') {
      return {
        outcome: 'pending',
        booking: data.booking,
        conflict: data.conflict,
        nextAvailableSlot: data.nextAvailableSlot ?? null,
      };
    }
    return { outcome: 'confirmed', booking: data.booking };
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 409 && err.code === 'BOOKING_CONFLICT') {
      return {
        outcome: 'conflict',
        conflict: err.body?.conflict,
        nextAvailableSlot: err.body?.nextAvailableSlot ?? null,
      };
    }
    throw err;
  }
}

export async function listMyBookings(status?: BookingStatus): Promise<Booking[]> {
  const q = status ? `?status=${status}` : '';
  const { bookings } = await apiGet<{ bookings: Booking[]; count: number }>(`/bookings${q}`);
  return bookings;
}

export async function getBooking(id: string): Promise<Booking> {
  const { booking } = await apiGet<{ booking: Booking }>(`/bookings/${id}`);
  return booking;
}

export async function cancelBooking(id: string): Promise<Booking> {
  const { booking } = await apiPatch<{ booking: Booking; status: BookingStatus }>(
    `/bookings/${id}/cancel`,
  );
  return booking;
}
