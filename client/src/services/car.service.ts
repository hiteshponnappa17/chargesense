import { apiGet } from '@/lib/api';
import type { CarModel } from '@/types';

export async function listCars(): Promise<CarModel[]> {
  const { cars } = await apiGet<{ cars: CarModel[]; count: number }>('/cars');
  return cars;
}
