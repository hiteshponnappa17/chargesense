import { Booking } from '../models/Booking';
import { Charger } from '../models/Charger';
import { settleElapsedBookings } from './booking.service';
import { parseHHmm, IST_OFFSET_MINUTES, istDayNumber } from '../utils/time';

const DAY_MS = 86_400_000;
const IST_MS = IST_OFFSET_MINUTES * 60_000;

/** UTC instant for IST midnight of the given IST day number. */
function istDayStartUtc(dayNumber: number): Date {
  return new Date(dayNumber * DAY_MS - IST_MS);
}

/** IST calendar parts of an instant. */
function istParts(date: Date) {
  const ist = new Date(date.getTime() + IST_MS);
  return { year: ist.getUTCFullYear(), month: ist.getUTCMonth(), day: ist.getUTCDate() };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getDriverDashboard(userId: string) {
  await settleElapsedBookings();
  const now = new Date();
  const bookings = await Booking.find({ userId })
    .populate({ path: 'chargerId', select: 'name city address connectorType powerKW pricePerKWh' })
    .sort({ startTime: -1 })
    .lean();

  const totalBookings = bookings.length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const upcoming = confirmed
    .filter((b) => new Date(b.startTime).getTime() > now.getTime())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const estimatedSpend = bookings
    .filter((b) => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.estimatedCost ?? 0), 0);

  const activeChargers = await Charger.countDocuments({ status: 'active' });

  const recentActivity = bookings.slice(0, 6).map((b) => ({
    id: String(b._id),
    type: b.status,
    bookingCode: b.bookingCode,
    chargerName: (b.chargerId as any)?.name ?? 'Charger',
    at: b.updatedAt ?? b.createdAt,
    amount: b.estimatedCost,
  }));

  return {
    stats: {
      availableChargers: activeChargers,
      upcomingBookings: upcoming.length,
      totalBookings,
      completedBookings: completed,
      estimatedSpend: Math.round(estimatedSpend * 100) / 100,
    },
    nextBooking: upcoming[0] ?? null,
    recentActivity,
  };
}

export async function getHostDashboard(hostId: string) {
  await settleElapsedBookings();
  const now = new Date();
  const chargers = await Charger.find({ ownerId: hostId }).lean();
  const chargerIds = chargers.map((c) => c._id);
  const activeChargers = chargers.filter((c) => c.status === 'active');

  const bookings = await Booking.find({ chargerId: { $in: chargerIds } })
    .populate({ path: 'chargerId', select: 'name city availableFrom availableUntil' })
    .populate({ path: 'userId', select: 'name' })
    .sort({ startTime: -1 })
    .lean();

  const revenueBookings = bookings.filter((b) => ['confirmed', 'completed'].includes(b.status));

  // Today (IST)
  const todayNum = istDayNumber(now);
  const todayStart = istDayStartUtc(todayNum);
  const todayEnd = new Date(todayStart.getTime() + DAY_MS);
  const todaysBookings = bookings.filter((b) => {
    const t = new Date(b.startTime).getTime();
    return t >= todayStart.getTime() && t < todayEnd.getTime() && b.status !== 'cancelled' && b.status !== 'rejected';
  }).length;

  // Monthly earnings (current IST month)
  const { year, month } = istParts(now);
  const monthlyEarnings = revenueBookings
    .filter((b) => {
      const p = istParts(new Date(b.startTime));
      return p.year === year && p.month === month;
    })
    .reduce((sum, b) => sum + (b.estimatedCost ?? 0), 0);

  // Bookings this week — trailing 7 IST days
  const weekBuckets: { day: string; date: string; bookings: number; earnings: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dayNum = todayNum - i;
    const start = istDayStartUtc(dayNum);
    const end = new Date(start.getTime() + DAY_MS);
    const inDay = bookings.filter((b) => {
      const t = new Date(b.startTime).getTime();
      return t >= start.getTime() && t < end.getTime() && b.status !== 'cancelled' && b.status !== 'rejected';
    });
    const earnings = inDay
      .filter((b) => ['confirmed', 'completed'].includes(b.status))
      .reduce((s, b) => s + (b.estimatedCost ?? 0), 0);
    weekBuckets.push({
      day: WEEKDAYS[new Date(start.getTime() + IST_MS).getUTCDay()],
      date: start.toISOString().slice(0, 10),
      bookings: inDay.length,
      earnings: Math.round(earnings * 100) / 100,
    });
  }

  // Utilization over the trailing 7 days: bookedMinutes / availableMinutes
  const windowStart = istDayStartUtc(todayNum - 6);
  const windowEnd = todayEnd;
  const perChargerUtil = activeChargers.map((c) => {
    const from = parseHHmm(c.availableFrom) ?? 0;
    const until = parseHHmm(c.availableUntil) ?? 0;
    const availableMinutesPerDay = Math.max(0, until - from);
    const availableMinutes = availableMinutesPerDay * 7;
    const booked = bookings
      .filter(
        (b) =>
          String((b.chargerId as any)?._id ?? b.chargerId) === String(c._id) &&
          ['confirmed', 'completed'].includes(b.status) &&
          new Date(b.startTime).getTime() < windowEnd.getTime() &&
          new Date(b.endTime).getTime() > windowStart.getTime(),
      )
      .reduce((s, b) => s + (b.durationMinutes ?? 0), 0);
    const pct = availableMinutes > 0 ? Math.min(100, Math.round((booked / availableMinutes) * 100)) : 0;
    return { chargerId: String(c._id), name: c.name, utilizationPct: pct };
  });

  const overallUtil =
    perChargerUtil.length > 0
      ? Math.round(perChargerUtil.reduce((s, u) => s + u.utilizationPct, 0) / perChargerUtil.length)
      : 0;

  const totalEarnings = revenueBookings.reduce((s, b) => s + (b.estimatedCost ?? 0), 0);

  const recentBookings = bookings.slice(0, 6).map((b) => ({
    id: String(b._id),
    bookingCode: b.bookingCode,
    driverName: (b.userId as any)?.name ?? 'Driver',
    chargerName: (b.chargerId as any)?.name ?? 'Charger',
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
    estimatedCost: b.estimatedCost,
  }));

  return {
    stats: {
      activeChargers: activeChargers.length,
      totalChargers: chargers.length,
      todaysBookings,
      monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      utilization: overallUtil,
      totalBookings: bookings.length,
    },
    charts: {
      week: weekBuckets,
      utilization: perChargerUtil,
    },
    recentBookings,
  };
}
