import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BatteryCharging,
  CalendarClock,
  Clock,
  Gauge,
  IndianRupee,
  MapPin,
  Navigation,
  Star,
  User,
  Zap,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConnectorBadge } from '@/components/charger/ConnectorBadge';
import { AmenityChips } from '@/components/charger/AmenityChips';
import { ChargersMap } from '@/components/charger/ChargersMap';
import { ConflictCard } from '@/components/booking/ConflictCard';
import { useToast } from '@/hooks/useToast';
import { getAvailability, getCharger } from '@/services/charger.service';
import { listCars } from '@/services/car.service';
import { computeEstimate } from '@/services/estimate.service';
import { createBooking } from '@/services/booking.service';
import { errorMessage } from '@/lib/api';
import { directionsUrl } from '@/lib/maps';
import { BATTERY_PRESETS, CONNECTOR_META, chargerSpeedTier } from '@/lib/constants';
import {
  formatCurrency,
  formatDuration,
  formatEnergy,
  formatTime,
  formatTimeRange,
  istDateTimeToISO,
  istHHmm,
  istTodayYYYYMMDD,
  istYYYYMMDD,
} from '@/lib/format';
import type { Availability, CarModel, Charger, EstimatorResult, TimeSlot } from '@/types';

function ownerName(charger: Charger): string {
  return typeof charger.ownerId === 'object' ? charger.ownerId.name : 'Host';
}

export default function ChargerDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [charger, setCharger] = useState<Charger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [cars, setCars] = useState<CarModel[]>([]);
  const [carId, setCarId] = useState('');
  const [currentPct, setCurrentPct] = useState(20);
  const [targetPct, setTargetPct] = useState(80);

  const [date, setDate] = useState(istTodayYYYYMMDD());
  const [startHHmm, setStartHHmm] = useState('18:00');
  const [durationMin, setDurationMin] = useState(60);

  const [estimate, setEstimate] = useState<EstimatorResult | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);

  const [reserving, setReserving] = useState(false);
  const [conflict, setConflict] = useState<{ conflict: TimeSlot; nextAvailableSlot: TimeSlot | null } | null>(
    null,
  );
  const formRef = useRef<HTMLDivElement>(null);

  // Load charger + cars.
  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getCharger(id)
      .then((c) => {
        setCharger(c);
        setStartHHmm(c.availableFrom || '18:00');
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);
  useEffect(() => {
    listCars()
      .then(setCars)
      .catch(() => setCars([]));
  }, []);

  // Availability for the selected date.
  useEffect(() => {
    if (!id) return;
    getAvailability(id, date)
      .then(setAvailability)
      .catch(() => setAvailability(null));
  }, [id, date]);

  const validPct = targetPct > currentPct && currentPct >= 0 && targetPct <= 100;

  // Live estimate (debounced) whenever inputs change.
  useEffect(() => {
    if (!charger || !validPct) {
      setEstimate(null);
      return;
    }
    setEstimating(true);
    const t = setTimeout(() => {
      computeEstimate({
        chargerId: charger._id,
        carModelId: carId || undefined,
        currentBatteryPct: currentPct,
        targetBatteryPct: targetPct,
      })
        .then(setEstimate)
        .catch(() => setEstimate(null))
        .finally(() => setEstimating(false));
    }, 300);
    return () => clearTimeout(t);
  }, [charger, carId, currentPct, targetPct, validPct]);

  const startISO = useMemo(() => istDateTimeToISO(date, startHHmm), [date, startHHmm]);
  const endISO = useMemo(
    () => new Date(new Date(startISO).getTime() + durationMin * 60_000).toISOString(),
    [startISO, durationMin],
  );

  const applySuggestedDuration = () => {
    if (!estimate) return;
    const rounded = Math.ceil(estimate.chargingTimeMinutes / 15) * 15;
    setDurationMin(Math.min(720, Math.max(15, rounded)));
  };

  const reserve = async () => {
    if (!charger) return;
    if (!validPct) {
      toast.error('Check battery levels', 'Target must be higher than current charge.');
      return;
    }
    setReserving(true);
    setConflict(null);
    try {
      const result = await createBooking({
        chargerId: charger._id,
        startTime: startISO,
        endTime: endISO,
        carModelId: carId || null,
        currentBatteryPct: currentPct,
        targetBatteryPct: targetPct,
      });
      if (result.outcome === 'confirmed') {
        toast.success('Booking confirmed!', charger.name);
        navigate(`/app/confirmation/${result.booking._id}`);
      } else if (result.outcome === 'pending') {
        toast.info('Added to the waitlist', 'You’ll be confirmed if the slot frees up.');
        navigate(`/app/confirmation/${result.booking._id}`);
      } else {
        setConflict({ conflict: result.conflict, nextAvailableSlot: result.nextAvailableSlot });
        toast.error('That slot was just taken');
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }
    } catch (err) {
      toast.error('Booking failed', errorMessage(err));
    } finally {
      setReserving(false);
    }
  };

  const useNextSlot = (slot: TimeSlot) => {
    setDate(istYYYYMMDD(slot.startTime));
    setStartHHmm(istHHmm(slot.startTime));
    const mins = Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60_000);
    if (mins >= 15) setDurationMin(Math.min(720, mins));
    setConflict(null);
    toast.info('Slot applied', 'Review and reserve the suggested time.');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !charger) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState title="Charger not found" onRetry={load} />
      </div>
    );
  }

  const tier = chargerSpeedTier(charger.powerKW);
  const accent = CONNECTOR_META[charger.connectorType].color;

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: charger info */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: accent }}
              >
                <Zap className="h-7 w-7 fill-white" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-ink">{charger.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {charger.address}, {charger.city}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge tone={tier.tone} icon={<Gauge className="h-3 w-3" />}>
                    {tier.label} · {charger.powerKW} kW
                  </Badge>
                  <ConnectorBadge type={charger.connectorType} />
                  {charger.isOpenNow ? <Badge tone="green">Open now</Badge> : <Badge tone="slate">Closed now</Badge>}
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {charger.rating.toFixed(1)} ({charger.reviewCount})
                  </span>
                </div>
              </div>
            </div>

            {charger.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted">{charger.description}</p>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Price</dt>
                <dd className="mt-0.5 font-semibold text-ink">{formatCurrency(charger.pricePerKWh)}/kWh</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Hours (IST)</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {charger.availableFrom} – {charger.availableUntil}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Host</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-semibold text-ink">
                  <User className="h-3.5 w-3.5 text-muted" /> {ownerName(charger)}
                </dd>
              </div>
            </dl>

            {charger.amenities.length > 0 && <AmenityChips amenities={charger.amenities} className="mt-5" />}
          </Card>

          <Card padded={false} className="overflow-hidden">
            <ChargersMap chargers={[charger]} selectedId={charger._id} className="h-64 rounded-none border-0" />
            <div className="flex items-center justify-between gap-3 border-t border-line p-4">
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-4 w-4 shrink-0" />
                {charger.address}, {charger.city}
              </p>
              <a
                href={directionsUrl(charger)}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                <Navigation className="h-4 w-4" /> Get directions
              </a>
            </div>
          </Card>
        </div>

        {/* Right: estimator + reservation */}
        <div ref={formRef} className="space-y-6">
          {conflict && (
            <ConflictCard
              conflict={conflict.conflict}
              nextAvailableSlot={conflict.nextAvailableSlot}
              onUseNextSlot={useNextSlot}
              onPickAnother={() => setConflict(null)}
            />
          )}

          <Card>
            <CardHeader title="Estimate & reserve" description="See the cost, then grab a slot." />

            <div className="mt-5 space-y-4">
              <Select
                label="Your EV"
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                placeholder="No specific EV (use charger estimate)"
                options={cars.map((c) => ({
                  value: c._id,
                  label: `${c.brand} ${c.model} · ${c.batteryCapacityKWh} kWh`,
                }))}
              />

              {/* Battery range */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-base mb-0">Battery</span>
                  <span className="text-sm font-medium text-ink">
                    {currentPct}% → {targetPct}%
                  </span>
                </div>
                <div className="mt-2 space-y-3">
                  <label className="block">
                    <span className="text-xs text-muted">Current charge</span>
                    <input
                      type="range"
                      min={0}
                      max={95}
                      step={5}
                      value={currentPct}
                      onChange={(e) => setCurrentPct(Math.min(Number(e.target.value), targetPct - 5))}
                      className="mt-1 w-full accent-brand-600"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">Target charge</span>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={targetPct}
                      onChange={(e) => setTargetPct(Math.max(Number(e.target.value), currentPct + 5))}
                      className="mt-1 w-full accent-brand-600"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {BATTERY_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setCurrentPct(p.current);
                        setTargetPct(p.target);
                      }}
                      className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-line transition hover:bg-slate-100 hover:text-ink"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimate result */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
                <EstimateTile
                  icon={<BatteryCharging className="h-4 w-4" />}
                  label="Energy"
                  value={estimate ? formatEnergy(estimate.requiredEnergyKWh) : '—'}
                  loading={estimating}
                />
                <EstimateTile
                  icon={<Clock className="h-4 w-4" />}
                  label="Time"
                  value={estimate ? formatDuration(estimate.chargingTimeMinutes) : '—'}
                  loading={estimating}
                />
                <EstimateTile
                  icon={<IndianRupee className="h-4 w-4" />}
                  label="Cost"
                  value={estimate ? formatCurrency(estimate.estimatedCost) : '—'}
                  loading={estimating}
                />
              </div>
              <p className="text-xs text-muted">
                Estimates only — actual energy, time and cost depend on your vehicle and conditions.
                {estimate ? ` Effective power ≈ ${estimate.effectivePowerKW} kW.` : ''}
              </p>

              {/* Slot selection */}
              <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
                <Input
                  label="Date"
                  type="date"
                  min={istTodayYYYYMMDD()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <Input
                  label="Start (IST)"
                  type="time"
                  value={startHHmm}
                  onChange={(e) => setStartHHmm(e.target.value)}
                />
                <Input
                  label="Duration (min)"
                  type="number"
                  min={15}
                  max={720}
                  step={15}
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  containerClassName="col-span-2 sm:col-span-1"
                />
                <div className="col-span-2 flex items-end sm:col-span-1">
                  {estimate && (
                    <Button variant="outline" size="sm" className="w-full" onClick={applySuggestedDuration}>
                      Match to estimate
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-line p-3 text-sm">
                <div className="flex items-center gap-2 text-ink">
                  <CalendarClock className="h-4 w-4 text-brand-600" />
                  <span className="font-medium">{formatTimeRange(startISO, endISO)}</span>
                  <span className="text-muted">· {formatDuration(durationMin)}</span>
                </div>
                {availability && availability.busySlots.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted">Already booked on this day:</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {availability.busySlots.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-inset ring-amber-200"
                        >
                          {formatTime(s.startTime)}–{formatTime(s.endTime)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button fullWidth size="lg" loading={reserving} onClick={reserve} disabled={!validPct}>
                Reserve this slot
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/app/chargers"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" /> Back to chargers
    </Link>
  );
}

function EstimateTile({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        {icon}
        {label}
      </span>
      <p className="mt-1 text-sm font-bold text-ink">
        {loading ? <span className="inline-block h-4 w-12 animate-shimmer rounded" /> : value}
      </p>
    </div>
  );
}
