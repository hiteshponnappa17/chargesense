/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { User } from '../models/User';
import { CarModel } from '../models/CarModel';
import { Charger } from '../models/Charger';
import { Booking } from '../models/Booking';
import { Counter } from '../models/Counter';
import { estimate } from '../services/estimator.service';
import { IST_OFFSET_MINUTES, istDayNumber, minutesBetween } from '../utils/time';
import { SEED_CARS, SEED_USERS, SEED_CHARGERS, DEMO_PASSWORD } from './data';

const DAY_MS = 86_400_000;

/** Build a real instant from an IST day offset (from today) and "HH:mm". */
function istDate(dayOffset: number, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const dayNum = istDayNumber(new Date()) + dayOffset;
  const dayStartUtcMs = dayNum * DAY_MS - IST_OFFSET_MINUTES * 60_000;
  return new Date(dayStartUtcMs + (h * 60 + m) * 60_000);
}

interface BookingSpec {
  charger: string;
  car: string;
  driver: string;
  dayOffset: number;
  from: string;
  to: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  cur: number;
  tgt: number;
}

const BOOKING_SPECS: BookingSpec[] = [
  // Meera (driver@example.com)
  { charger: 'c1', car: 'Tata Nexon EV', driver: 'driver1', dayOffset: 1, from: '18:00', to: '20:00', status: 'confirmed', cur: 30, tgt: 80 },
  { charger: 'c2', car: 'Hyundai Ioniq 5', driver: 'driver1', dayOffset: 2, from: '10:00', to: '11:00', status: 'confirmed', cur: 20, tgt: 70 },
  { charger: 'c3', car: 'MG ZS EV', driver: 'driver1', dayOffset: -2, from: '09:00', to: '10:30', status: 'completed', cur: 40, tgt: 80 },
  { charger: 'c5', car: 'Tata Nexon EV', driver: 'driver1', dayOffset: -5, from: '19:00', to: '20:30', status: 'completed', cur: 25, tgt: 75 },
  { charger: 'c1', car: 'Tata Nexon EV', driver: 'driver1', dayOffset: -6, from: '07:00', to: '08:00', status: 'completed', cur: 50, tgt: 70 },
  { charger: 'c4', car: 'MG ZS EV', driver: 'driver1', dayOffset: -1, from: '15:00', to: '16:30', status: 'cancelled', cur: 35, tgt: 70 },
  // Arjun (driver2@example.com)
  { charger: 'c1', car: 'BYD Atto 3', driver: 'driver2', dayOffset: -3, from: '12:00', to: '13:00', status: 'completed', cur: 45, tgt: 70 },
  { charger: 'c2', car: 'Mahindra XUV400', driver: 'driver2', dayOffset: 1, from: '14:00', to: '15:30', status: 'confirmed', cur: 30, tgt: 80 },
  { charger: 'c6', car: 'Hyundai Ioniq 5', driver: 'driver2', dayOffset: 3, from: '09:00', to: '10:00', status: 'confirmed', cur: 20, tgt: 60 },
  { charger: 'c7', car: 'Tata Punch EV', driver: 'driver2', dayOffset: -4, from: '10:00', to: '11:00', status: 'completed', cur: 40, tgt: 60 },
  { charger: 'c4', car: 'BYD Atto 3', driver: 'driver2', dayOffset: -7, from: '11:00', to: '12:30', status: 'completed', cur: 30, tgt: 75 },
  { charger: 'c2', car: 'MG ZS EV', driver: 'driver2', dayOffset: -1, from: '16:00', to: '17:00', status: 'completed', cur: 50, tgt: 80 },
];

async function seed(): Promise<void> {
  console.log('🌱 Seeding ChargeSense database...');
  await connectDatabase();

  // Clear existing data for a clean, repeatable seed.
  await Promise.all([
    User.deleteMany({}),
    CarModel.deleteMany({}),
    Charger.deleteMany({}),
    Booking.deleteMany({}),
    Counter.deleteMany({}),
  ]);
  console.log('   • Cleared existing collections');

  // Cars
  const cars = await CarModel.insertMany(SEED_CARS);
  const carByName = new Map(cars.map((c) => [`${c.brand} ${c.model}`, c]));
  console.log(`   • Inserted ${cars.length} car models`);

  // Users (hashed password)
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const usersToInsert = SEED_USERS.map((u) => ({
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    passwordHash,
    // Give drivers a sensible default vehicle for the estimator prefill.
    defaultCarModelId:
      u.role === 'driver'
        ? carByName.get(u.key === 'driver1' ? 'Tata Nexon EV' : 'BYD Atto 3')?._id ?? null
        : null,
  }));
  const users = await User.insertMany(usersToInsert);
  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const userByKey = new Map(SEED_USERS.map((u) => [u.key, userByEmail.get(u.email)!]));
  console.log(`   • Inserted ${users.length} users`);

  // Chargers
  const chargersToInsert = SEED_CHARGERS.map((c) => ({
    ownerId: userByKey.get(c.ownerKey)!._id,
    name: c.name,
    description: c.description,
    address: c.address,
    city: c.city,
    latitude: c.latitude,
    longitude: c.longitude,
    connectorType: c.connectorType,
    powerKW: c.powerKW,
    pricePerKWh: c.pricePerKWh,
    availableFrom: c.availableFrom,
    availableUntil: c.availableUntil,
    amenities: c.amenities,
    status: c.status,
    rating: c.rating,
    reviewCount: c.reviewCount,
  }));
  const chargers = await Charger.insertMany(chargersToInsert);
  const chargerByKey = new Map(SEED_CHARGERS.map((c, i) => [c.key, chargers[i]]));
  console.log(`   • Inserted ${chargers.length} chargers`);

  // Bookings (with real estimator-derived energy/cost) via insertMany with
  // controlled timestamps so history/analytics look realistic.
  const year = new Date(Date.now() + IST_OFFSET_MINUTES * 60_000).getUTCFullYear();
  const now = new Date();

  const bookingDocs = BOOKING_SPECS.map((spec, index) => {
    const charger = chargerByKey.get(spec.charger)!;
    const car = carByName.get(spec.car)!;
    const startTime = istDate(spec.dayOffset, spec.from);
    const endTime = istDate(spec.dayOffset, spec.to);
    const durationMinutes = minutesBetween(startTime, endTime);
    const est = estimate({
      batteryCapacityKWh: car.batteryCapacityKWh,
      currentBatteryPct: spec.cur,
      targetBatteryPct: spec.tgt,
      chargerPowerKW: charger.powerKW,
      vehicleMaxPowerKW: car.maxChargingPowerKW,
      pricePerKWh: charger.pricePerKWh,
    });

    const createdAt = new Date(startTime.getTime() - DAY_MS); // requested ~1 day before
    let updatedAt = spec.dayOffset >= 0 ? now : new Date(endTime.getTime());
    let cancelledAt: Date | null = null;
    if (spec.status === 'cancelled') {
      cancelledAt = new Date(startTime.getTime() - 2 * 60 * 60_000);
      updatedAt = cancelledAt;
    }

    return {
      bookingCode: `CS-${year}-${String(index + 1).padStart(6, '0')}`,
      userId: userByKey.get(spec.driver)!._id,
      chargerId: charger._id,
      carModelId: car._id,
      startTime,
      endTime,
      durationMinutes,
      currentBatteryPct: spec.cur,
      targetBatteryPct: spec.tgt,
      estimatedEnergyKWh: est.requiredEnergyKWh,
      estimatedCost: est.estimatedCost,
      chargingTimeMinutes: est.chargingTimeMinutes,
      status: spec.status,
      queuePosition: 1,
      requestedAt: createdAt,
      cancelledAt,
      createdAt,
      updatedAt,
    };
  });

  // `timestamps: false` keeps our controlled createdAt/updatedAt (a valid
  // runtime option that Mongoose's InsertManyOptions typings omit).
  await Booking.insertMany(bookingDocs, { timestamps: false } as Record<string, unknown>);
  // Advance the booking-code counter so app-created bookings continue the run.
  await Counter.findByIdAndUpdate('booking', { seq: bookingDocs.length }, { upsert: true });
  console.log(`   • Inserted ${bookingDocs.length} bookings`);

  // Ensure declared indexes exist.
  await Promise.all([User.syncIndexes(), Charger.syncIndexes(), Booking.syncIndexes(), CarModel.syncIndexes()]);
  console.log('   • Synced indexes');

  console.log('\n✅ Seed complete.\n');
  console.log('   Demo credentials (password for all):  ' + DEMO_PASSWORD);
  console.log('   ───────────────────────────────────────────────');
  console.log('   Driver   →  driver@example.com');
  console.log('   Driver 2 →  driver2@example.com');
  console.log('   Host     →  host@example.com');
  console.log('   Host 2   →  host2@example.com');
  console.log('   ───────────────────────────────────────────────\n');

  await disconnectDatabase();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('\n❌ Seed failed:', err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
