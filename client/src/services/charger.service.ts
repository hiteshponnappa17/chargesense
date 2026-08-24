import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Availability, Charger, ChargerFormValues } from '@/types';

export interface ChargerFilters {
  city?: string;
  connectorType?: string;
  maxPrice?: number;
  minPower?: number;
  availableNow?: boolean;
  search?: string;
  sort?: 'nearest' | 'price' | 'power' | 'rating';
  lat?: number;
  lng?: number;
}

function toQuery(filters: ChargerFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    params.set(key, String(value));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function listChargers(filters: ChargerFilters = {}): Promise<Charger[]> {
  const { chargers } = await apiGet<{ chargers: Charger[]; count: number }>(
    `/chargers${toQuery(filters)}`,
  );
  return chargers;
}

export async function getCharger(id: string): Promise<Charger> {
  const { charger } = await apiGet<{ charger: Charger }>(`/chargers/${id}`);
  return charger;
}

export async function getAvailability(id: string, dateISO?: string): Promise<Availability> {
  const q = dateISO ? `?date=${encodeURIComponent(dateISO)}` : '';
  return apiGet<Availability>(`/chargers/${id}/availability${q}`);
}

export async function createCharger(values: ChargerFormValues): Promise<Charger> {
  const { charger } = await apiPost<{ charger: Charger }>('/chargers', values);
  return charger;
}

export async function updateCharger(id: string, values: Partial<ChargerFormValues>): Promise<Charger> {
  const { charger } = await apiPatch<{ charger: Charger }>(`/chargers/${id}`, values);
  return charger;
}

export async function deleteCharger(
  id: string,
): Promise<{ deleted: boolean; disabled: boolean; activeBookings: number }> {
  return apiDelete<{ deleted: boolean; disabled: boolean; activeBookings: number }>(`/chargers/${id}`);
}
