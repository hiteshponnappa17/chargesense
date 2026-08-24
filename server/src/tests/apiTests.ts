/* eslint-disable no-console */
/**
 * End-to-end API + FCFS verification.
 * Boots a REAL in-memory mongod (ephemeral), starts the Express app, and drives
 * the full flow over HTTP. Run with: npm run test:api
 */
import http from 'node:http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { createApp } from '../app';
import { CarModel } from '../models/CarModel';
import { Booking } from '../models/Booking';
import { SEED_CARS } from '../seed/data';
import { IST_OFFSET_MINUTES, istDayNumber } from '../utils/time';

const DAY_MS = 86_400_000;
const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}/api`;

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    pass += 1;
    console.log('  \x1b[32m✓\x1b[0m', name);
  } else {
    fail += 1;
    failures.push(name);
    console.log('  \x1b[31m✗\x1b[0m', name, extra !== undefined ? JSON.stringify(extra) : '');
  }
}

interface ApiResult {
  status: number;
  body: any;
}

async function api(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<ApiResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, body };
}

function istISO(dayOffset: number, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const dayNum = istDayNumber(new Date()) + dayOffset;
  const dayStartUtcMs = dayNum * DAY_MS - IST_OFFSET_MINUTES * 60_000;
  return new Date(dayStartUtcMs + (h * 60 + m) * 60_000).toISOString();
}

async function book(
  token: string,
  chargerId: string,
  dayOffset: number,
  from: string,
  to: string,
  opts: { car?: string; cur?: number; tgt?: number; joinQueue?: boolean } = {},
): Promise<ApiResult> {
  return api('POST', '/bookings', {
    token,
    body: {
      chargerId,
      startTime: istISO(dayOffset, from),
      endTime: istISO(dayOffset, to),
      carModelId: opts.car,
      currentBatteryPct: opts.cur,
      targetBatteryPct: opts.tgt,
      joinQueue: opts.joinQueue,
    },
  });
}

async function main() {
  console.log('\n🧪 ChargeSense API + FCFS test suite\n');
  const mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri('chargesense_test'));

  const cars = await CarModel.insertMany(SEED_CARS);
  const nexon = cars.find((c) => c.model === 'Nexon EV')!;

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  try {
    // ---- Health ----
    const health = await api('GET', '/health');
    check('health endpoint returns ok', health.status === 200 && health.body?.data?.status === 'ok');

    // ---- Auth ----
    const regDriver = await api('POST', '/auth/register', {
      body: { name: 'Test Driver', email: 'd1@test.com', phone: '9876543210', password: 'secret123', role: 'driver' },
    });
    check('register driver → 201 + token', regDriver.status === 201 && !!regDriver.body?.data?.token, regDriver.body);
    const driverToken = regDriver.body?.data?.token;

    const regDriver2 = await api('POST', '/auth/register', {
      body: { name: 'Test Driver2', email: 'd2@test.com', phone: '9876500000', password: 'secret123', role: 'driver' },
    });
    const driver2Token = regDriver2.body?.data?.token;

    const regHost = await api('POST', '/auth/register', {
      body: { name: 'Test Host', email: 'h1@test.com', phone: '9000000000', password: 'secret123', role: 'host' },
    });
    check('register host → 201', regHost.status === 201);
    const hostToken = regHost.body?.data?.token;

    const regHost2 = await api('POST', '/auth/register', {
      body: { name: 'Test Host2', email: 'h2@test.com', phone: '9000000001', password: 'secret123', role: 'host' },
    });
    const host2Token = regHost2.body?.data?.token;

    const dup = await api('POST', '/auth/register', {
      body: { name: 'Dup', email: 'd1@test.com', phone: '9876543210', password: 'secret123', role: 'driver' },
    });
    check('duplicate email → 409 EMAIL_TAKEN', dup.status === 409 && dup.body?.code === 'EMAIL_TAKEN', dup.body);

    const badLogin = await api('POST', '/auth/login', { body: { email: 'd1@test.com', password: 'wrongpass' } });
    check('login wrong password → 401', badLogin.status === 401 && badLogin.body?.code === 'INVALID_CREDENTIALS');

    const goodLogin = await api('POST', '/auth/login', { body: { email: 'd1@test.com', password: 'secret123' } });
    check('login correct → 200 + token', goodLogin.status === 200 && !!goodLogin.body?.data?.token);

    const meNoToken = await api('GET', '/auth/me');
    check('protected route without token → 401', meNoToken.status === 401);

    const me = await api('GET', '/auth/me', { token: driverToken });
    check('GET /me with token → 200 role=driver', me.status === 200 && me.body?.data?.user?.role === 'driver');

    // ---- Chargers ----
    const invalidReg = await api('POST', '/auth/register', {
      body: { name: 'x', email: 'not-an-email', phone: '1', password: '12', role: 'driver' },
    });
    check('invalid register payload → 400 VALIDATION_ERROR', invalidReg.status === 400 && invalidReg.body?.code === 'VALIDATION_ERROR');

    const chargerBody = {
      name: 'Test CCS Charger',
      description: 'test',
      address: '1 Test Road',
      city: 'Mysuru',
      latitude: 12.3,
      longitude: 76.6,
      connectorType: 'CCS',
      powerKW: 50,
      pricePerKWh: 15,
      availableFrom: '05:00',
      availableUntil: '23:00',
      amenities: ['Parking'],
    };

    const createAsDriver = await api('POST', '/chargers', { token: driverToken, body: chargerBody });
    check('driver cannot create charger → 403', createAsDriver.status === 403, createAsDriver.body);

    const createCharger = await api('POST', '/chargers', { token: hostToken, body: chargerBody });
    check('host creates charger → 201', createCharger.status === 201, createCharger.body);
    const chargerId = createCharger.body?.data?.charger?._id;

    const createType2 = await api('POST', '/chargers', {
      token: hostToken,
      body: { ...chargerBody, name: 'Test Type2', connectorType: 'Type 2', powerKW: 7.4, pricePerKWh: 9 },
    });
    const type2Id = createType2.body?.data?.charger?._id;

    const listAll = await api('GET', '/chargers');
    check('list chargers → returns created', listAll.status === 200 && listAll.body?.data?.count >= 2);

    const filterCcs = await api('GET', '/chargers?connectorType=CCS');
    check(
      'filter connectorType=CCS works',
      filterCcs.status === 200 && filterCcs.body.data.chargers.every((c: any) => c.connectorType === 'CCS'),
    );

    const filterPrice = await api('GET', '/chargers?maxPrice=10');
    check(
      'filter maxPrice=10 works',
      filterPrice.body.data.chargers.every((c: any) => c.pricePerKWh <= 10),
    );

    const getOne = await api('GET', `/chargers/${chargerId}`);
    check('get charger by id → 200', getOne.status === 200 && getOne.body?.data?.charger?._id === chargerId);

    const patchOther = await api('PATCH', `/chargers/${chargerId}`, { token: host2Token, body: { pricePerKWh: 99 } });
    check("host2 cannot edit host1's charger → 403", patchOther.status === 403, patchOther.body);

    const patchOwn = await api('PATCH', `/chargers/${chargerId}`, { token: hostToken, body: { pricePerKWh: 16 } });
    check('owner edits charger → 200 price updated', patchOwn.status === 200 && patchOwn.body?.data?.charger?.pricePerKWh === 16);

    // ---- FCFS scenarios ----
    const clear = async () => {
      await Booking.deleteMany({ chargerId });
    };
    const bookOpts = { car: String(nexon._id), cur: 30, tgt: 80 };

    // Test 1: adjacent slots — both confirmed
    await clear();
    const t1a = await book(driverToken, chargerId, 2, '18:00', '20:00', bookOpts);
    const t1b = await book(driverToken, chargerId, 2, '20:00', '22:00', bookOpts);
    check('FCFS 1: 18-20 & 20-22 both confirmed', t1a.status === 201 && t1b.status === 201, {
      a: t1a.status,
      b: t1b.status,
    });

    // Test 2: overlap (19-21 vs 18-20) — reject + nextAvailableSlot
    await clear();
    const t2a = await book(driverToken, chargerId, 2, '18:00', '20:00', bookOpts);
    const t2b = await book(driverToken, chargerId, 2, '19:00', '21:00', bookOpts);
    check(
      'FCFS 2: 19-21 conflicts with 18-20 → 409 BOOKING_CONFLICT',
      t2a.status === 201 && t2b.status === 409 && t2b.body?.code === 'BOOKING_CONFLICT',
      { b: t2b.body },
    );
    check('FCFS 2: conflict returns nextAvailableSlot', !!t2b.body?.nextAvailableSlot?.startTime, t2b.body?.nextAvailableSlot);
    // Book the suggested next slot → should confirm
    if (t2b.body?.nextAvailableSlot) {
      const nextSlot = await api('POST', '/bookings', {
        token: driverToken,
        body: {
          chargerId,
          startTime: t2b.body.nextAvailableSlot.startTime,
          endTime: t2b.body.nextAvailableSlot.endTime,
          ...bookOpts,
        },
      });
      check('FCFS 2: booking the suggested next slot → confirmed', nextSlot.status === 201, nextSlot.body);
    }

    // Test 3: overlap (17-19 vs 18-20)
    await clear();
    const t3a = await book(driverToken, chargerId, 2, '18:00', '20:00', bookOpts);
    const t3b = await book(driverToken, chargerId, 2, '17:00', '19:00', bookOpts);
    check('FCFS 3: 17-19 conflicts with 18-20 → 409', t3a.status === 201 && t3b.status === 409);

    // Test 4: identical slots — only first confirmed
    await clear();
    const t4a = await book(driverToken, chargerId, 2, '18:00', '20:00', bookOpts);
    const t4b = await book(driver2Token, chargerId, 2, '18:00', '20:00', bookOpts);
    check('FCFS 4: identical slot, first confirmed second rejected', t4a.status === 201 && t4b.status === 409, {
      a: t4a.status,
      b: t4b.status,
    });

    // Test 5: cancellation frees slot for a queued (pending) request
    await clear();
    const t5a = await book(driverToken, chargerId, 2, '18:00', '20:00', bookOpts);
    const t5b = await book(driver2Token, chargerId, 2, '18:00', '20:00', { ...bookOpts, joinQueue: true });
    check('FCFS 5: queued request → 202 pending', t5b.status === 202 && t5b.body?.data?.status === 'pending', t5b.body);
    const aId = t5a.body?.data?.booking?._id;
    const bId = t5b.body?.data?.booking?._id;
    const cancelA = await api('PATCH', `/bookings/${aId}/cancel`, { token: driverToken });
    check('FCFS 5: cancel confirmed booking → 200', cancelA.status === 200 && cancelA.body?.data?.status === 'cancelled');
    const bAfter = await api('GET', `/bookings/${bId}`, { token: driver2Token });
    check('FCFS 5: pending promoted to confirmed after cancel', bAfter.body?.data?.booking?.status === 'confirmed', bAfter.body?.data?.booking?.status);

    // ---- Booking validations ----
    await clear();
    const outside = await book(driverToken, chargerId, 2, '03:00', '04:00', bookOpts);
    check('booking outside availability window → 400 OUTSIDE_AVAILABILITY', outside.status === 400 && outside.body?.code === 'OUTSIDE_AVAILABILITY', outside.body);

    const past = await book(driverToken, chargerId, -2, '10:00', '11:00', bookOpts);
    check('booking in the past → 400 START_IN_PAST', past.status === 400 && past.body?.code === 'START_IN_PAST', past.body);

    // Inactive charger cannot be booked
    await api('PATCH', `/chargers/${type2Id}`, { token: hostToken, body: { status: 'maintenance' } });
    const inactiveBook = await book(driverToken, type2Id, 2, '10:00', '11:00', bookOpts);
    check('booking a maintenance charger → 409 CHARGER_UNAVAILABLE', inactiveBook.status === 409 && inactiveBook.body?.code === 'CHARGER_UNAVAILABLE', inactiveBook.body);
    await api('PATCH', `/chargers/${type2Id}`, { token: hostToken, body: { status: 'active' } });

    // ---- Authorization on booking details ----
    await clear();
    const mine = await book(driverToken, chargerId, 3, '09:00', '10:00', bookOpts);
    const mineId = mine.body?.data?.booking?._id;
    const otherReads = await api('GET', `/bookings/${mineId}`, { token: driver2Token });
    check("driver2 cannot read driver1's booking → 403", otherReads.status === 403, otherReads.body);
    const hostReadsOwnCharger = await api('GET', `/bookings/${mineId}`, { token: hostToken });
    check('host CAN read a booking on their own charger → 200', hostReadsOwnCharger.status === 200, hostReadsOwnCharger.body);

    // Cancel + double cancel
    const cancelMine = await api('PATCH', `/bookings/${mineId}/cancel`, { token: driverToken });
    check('cancel own booking → 200 cancelled', cancelMine.status === 200 && cancelMine.body?.data?.status === 'cancelled');
    const cancelAgain = await api('PATCH', `/bookings/${mineId}/cancel`, { token: driverToken });
    check('cancel already-cancelled → 400 NOT_CANCELLABLE', cancelAgain.status === 400 && cancelAgain.body?.code === 'NOT_CANCELLABLE');

    // ---- Estimator ----
    const est = await api('POST', '/estimate', {
      body: { carModelId: String(nexon._id), chargerId, currentBatteryPct: 30, targetBatteryPct: 80 },
    });
    // Nexon 40.5 kWh, 30→80% = 40.5 × 0.5 = 20.25 kWh
    check('estimate energy for Nexon 30→80 ≈ 20.25 kWh', est.status === 200 && Math.abs(est.body.data.requiredEnergyKWh - 20.25) < 0.01, est.body?.data);

    // ---- Cars ----
    const carsRes = await api('GET', '/cars');
    check('cars list → 6 models', carsRes.status === 200 && carsRes.body?.data?.count === SEED_CARS.length);

    // ---- Dashboards ----
    const hostDash = await api('GET', '/host/dashboard', { token: hostToken });
    check('host dashboard → 200 with stats', hostDash.status === 200 && typeof hostDash.body?.data?.stats?.activeChargers === 'number');
    const hostDashAsDriver = await api('GET', '/host/dashboard', { token: driverToken });
    check('driver cannot access host dashboard → 403', hostDashAsDriver.status === 403);
    const driverDash = await api('GET', '/dashboard', { token: driverToken });
    check('driver dashboard → 200 with stats', driverDash.status === 200 && typeof driverDash.body?.data?.stats?.totalBookings === 'number');

    // ---- Delete with active booking disables instead ----
    await clear();
    await book(driverToken, chargerId, 4, '09:00', '10:00', bookOpts);
    const del = await api('DELETE', `/chargers/${chargerId}`, { token: hostToken });
    check('delete charger with active booking → disabled not deleted', del.status === 200 && del.body?.data?.disabled === true, del.body?.data);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
    await mongod.stop();
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`  ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log('  Failed:', failures.join(', '));
    console.log('──────────────────────────────────────\n');
    process.exit(1);
  }
  console.log('  ✅ All API + FCFS tests passed');
  console.log('──────────────────────────────────────\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Test harness crashed:', err);
  process.exit(1);
});
