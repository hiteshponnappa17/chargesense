import { Types } from 'mongoose';
import { Charger, type ChargerDoc } from '../models/Charger';
import { Booking } from '../models/Booking';
import { ApiError } from '../utils/ApiError';
import { haversineKm } from '../utils/geo';
import { parseHHmm, istMinutesOfDay } from '../utils/time';

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

/** True if `now` (IST wall clock) is inside the charger's daily window. */
function isOpenNow(charger: { availableFrom: string; availableUntil: string; status: string }, now = new Date()): boolean {
  if (charger.status !== 'active') return false;
  const from = parseHHmm(charger.availableFrom);
  const until = parseHHmm(charger.availableUntil);
  if (from === null || until === null) return false;
  const nowMin = istMinutesOfDay(now);
  return nowMin >= from && nowMin < until;
}

export async function listChargers(filters: ChargerFilters) {
  const query: Record<string, unknown> = {};

  // By default the public discovery list hides non-active chargers.
  query.status = 'active';

  if (filters.city) query.city = new RegExp(`^${escapeRegex(filters.city)}$`, 'i');
  if (filters.connectorType) query.connectorType = filters.connectorType;
  if (filters.maxPrice !== undefined) query.pricePerKWh = { $lte: filters.maxPrice };
  if (filters.minPower !== undefined) query.powerKW = { $gte: filters.minPower };

  if (filters.search) {
    const rx = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [{ name: rx }, { city: rx }, { address: rx }];
  }

  const rows = await Charger.find(query)
    .populate({ path: 'ownerId', select: 'name' })
    .lean();

  const now = new Date();
  let results = rows.map((c) => {
    const openNow = isOpenNow(c, now);
    const distanceKm =
      filters.lat !== undefined && filters.lng !== undefined
        ? haversineKm(filters.lat, filters.lng, c.latitude, c.longitude)
        : null;
    return { ...c, isOpenNow: openNow, distanceKm };
  });

  if (filters.availableNow) results = results.filter((c) => c.isOpenNow);

  switch (filters.sort) {
    case 'price':
      results.sort((a, b) => a.pricePerKWh - b.pricePerKWh);
      break;
    case 'power':
      results.sort((a, b) => b.powerKW - a.powerKW);
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'nearest':
      results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      break;
    default:
      if (filters.lat !== undefined && filters.lng !== undefined) {
        results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      }
  }

  return results;
}

export async function getChargerById(id: string) {
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid charger id', 'INVALID_ID');
  const charger = await Charger.findById(id)
    .populate({ path: 'ownerId', select: 'name email phone createdAt' })
    .lean();
  if (!charger) throw ApiError.notFound('Charger not found', 'CHARGER_NOT_FOUND');
  return { ...charger, isOpenNow: isOpenNow(charger) };
}

export async function createCharger(ownerId: string, data: Partial<ChargerDoc>) {
  const charger = await Charger.create({ ...data, ownerId: new Types.ObjectId(ownerId) });
  return charger;
}

async function loadOwnedCharger(id: string, ownerId: string): Promise<ChargerDoc> {
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid charger id', 'INVALID_ID');
  const charger = await Charger.findById(id);
  if (!charger) throw ApiError.notFound('Charger not found', 'CHARGER_NOT_FOUND');
  if (String(charger.ownerId) !== String(ownerId)) {
    throw ApiError.forbidden('You can only manage chargers you own');
  }
  return charger;
}

export async function updateCharger(id: string, ownerId: string, data: Partial<ChargerDoc>) {
  const charger = await loadOwnedCharger(id, ownerId);
  Object.assign(charger, data);
  await charger.save();
  return charger;
}

/**
 * Delete a charger. If it has upcoming confirmed/pending bookings we DO NOT
 * hard-delete (that would strand real bookings) — we disable it instead and
 * report that back to the caller.
 */
export async function deleteCharger(
  id: string,
  ownerId: string,
): Promise<{ deleted: boolean; disabled: boolean; activeBookings: number }> {
  const charger = await loadOwnedCharger(id, ownerId);

  const activeBookings = await Booking.countDocuments({
    chargerId: charger._id,
    status: { $in: ['confirmed', 'pending'] },
    endTime: { $gt: new Date() },
  });

  if (activeBookings > 0) {
    charger.status = 'inactive';
    await charger.save();
    return { deleted: false, disabled: true, activeBookings };
  }

  await Charger.deleteOne({ _id: charger._id });
  return { deleted: true, disabled: false, activeBookings: 0 };
}

/** Host's chargers with per-charger booking + earnings rollups. */
export async function getHostChargers(ownerId: string) {
  const chargers = await Charger.find({ ownerId }).sort({ createdAt: -1 }).lean();
  const ids = chargers.map((c) => c._id);

  const agg = await Booking.aggregate([
    { $match: { chargerId: { $in: ids } } },
    {
      $group: {
        _id: '$chargerId',
        totalBookings: { $sum: 1 },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        earnings: {
          $sum: {
            $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$estimatedCost', 0],
          },
        },
      },
    },
  ]);
  const byCharger = new Map(agg.map((a) => [String(a._id), a]));

  return chargers.map((c) => {
    const stats = byCharger.get(String(c._id));
    return {
      ...c,
      isOpenNow: isOpenNow(c),
      bookingCount: stats?.totalBookings ?? 0,
      confirmedCount: stats?.confirmed ?? 0,
      completedCount: stats?.completed ?? 0,
      estimatedEarnings: Math.round((stats?.earnings ?? 0) * 100) / 100,
    };
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
