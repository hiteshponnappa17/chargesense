import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BatteryCharging,
  CalendarClock,
  Car,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/booking/StatusBadge';
import { isCancellable } from '@/components/booking/BookingCard';
import { useToast } from '@/hooks/useToast';
import { cancelBooking, getBooking } from '@/services/booking.service';
import { errorMessage } from '@/lib/api';
import { directionsUrl } from '@/lib/maps';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatEnergy,
  formatTimeRange,
  relativeDayLabel,
} from '@/lib/format';
import type { Booking, Charger, PopulatedCarRef } from '@/types';

export default function BookingDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getBooking(id)
      .then(setBooking)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const confirmCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const updated = await cancelBooking(booking._id);
      setBooking(updated);
      setConfirmOpen(false);
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error('Could not cancel', errorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const back = (
    <button
      type="button"
      onClick={() => navigate('/app/bookings')}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" /> Back to bookings
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {back}
        <Skeleton className="mx-auto h-96 max-w-2xl rounded-2xl" />
      </div>
    );
  }
  if (error || !booking) {
    return (
      <div className="space-y-6">
        {back}
        <ErrorState title="Booking not found" onRetry={load} />
      </div>
    );
  }

  const charger = typeof booking.chargerId === 'object' ? (booking.chargerId as Charger) : null;
  const car = typeof booking.carModelId === 'object' ? (booking.carModelId as PopulatedCarRef) : null;
  const canCancel = isCancellable(booking);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {back}

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-muted">{booking.bookingCode}</p>
            <h1 className="mt-1 text-xl font-bold text-ink">
              {charger ? charger.name : 'Charging booking'}
            </h1>
            {charger && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-4 w-4 shrink-0" />
                {charger.address}, {charger.city}
              </p>
            )}
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <Detail icon={<CalendarClock className="h-4 w-4" />} label="When">
            {relativeDayLabel(booking.startTime)}, {formatTimeRange(booking.startTime, booking.endTime)}
          </Detail>
          <Detail icon={<Clock className="h-4 w-4" />} label="Duration">
            {formatDuration(booking.durationMinutes)}
          </Detail>
          <Detail icon={<BatteryCharging className="h-4 w-4" />} label="Battery">
            {booking.currentBatteryPct != null && booking.targetBatteryPct != null
              ? `${booking.currentBatteryPct}% → ${booking.targetBatteryPct}%`
              : 'Not specified'}
          </Detail>
          <Detail icon={<Car className="h-4 w-4" />} label="Vehicle">
            {car ? `${car.brand} ${car.model}` : 'Not specified'}
          </Detail>
          <Detail icon={<Zap className="h-4 w-4" />} label="Estimated energy">
            {formatEnergy(booking.estimatedEnergyKWh)}
          </Detail>
          <Detail icon={<IndianRupee className="h-4 w-4" />} label="Estimated cost">
            {formatCurrency(booking.estimatedCost)}
          </Detail>
        </dl>

        <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
          Requested {formatDateTime(booking.requestedAt)}
          {booking.cancelledAt ? ` · Cancelled ${formatDateTime(booking.cancelledAt)}` : ''}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {charger && (
            <Link
              to={`/app/chargers/${charger._id}`}
              className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              View charger
            </Link>
          )}
          {charger && (
            <a
              href={directionsUrl(charger)}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({ variant: 'outline' })}
            >
              <Navigation className="h-4 w-4" /> Get directions
            </a>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Cancel booking
            </Button>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this booking?"
        message={`Booking ${booking.bookingCode} will be cancelled. This can’t be undone.`}
        confirmLabel="Cancel booking"
        cancelLabel="Keep it"
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => (cancelling ? null : setConfirmOpen(false))}
      />
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <span className="text-brand-600">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 font-medium text-ink">{children}</dd>
    </div>
  );
}
