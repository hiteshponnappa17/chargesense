import { apiGet } from '@/lib/api';
import type { DriverDashboard } from '@/types';

export async function getDriverDashboard(): Promise<DriverDashboard> {
  return apiGet<DriverDashboard>('/dashboard');
}
