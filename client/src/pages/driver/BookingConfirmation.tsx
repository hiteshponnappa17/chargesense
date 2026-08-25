import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Hourglass,
  MapPin,
  Navigation,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { buttonClasses } from '@/components/ui/Button';
import { StatusBadge } from '@/components/booking/StatusBadge';
import { getBooking } from '@/services/booking.service';
import {
  formatCurrency,
  formatDuration,
  formatEnergy,
  formatTimeRange,
  relativeDayLabel,
} from '@/lib/format';
import { directionsUrl } from '@/lib/maps';
import { cn } from '@/lib/cn';
import type { Booking, Charger } from '@/types';

export default function BookingConfirmation() {
  const { id = '' } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getBooking(id)
      .then(setBooking)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  if (loading) return <Skeleton className="mx-auto h-96 max-w-xl rounded-2xl" />;
  if (error || !booking) return <ErrorState title="Booking not found" onRetry={load} />;

  const charger = typeof booking.chargerId === 'object' ? (booking.chargerId as Charger) : null;
  const chargerName = charger?.name ?? 'Charger';
  const isPending = booking.status === 'pending';

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4">
      <div className="text-center">
        <div
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
            isPending ? 'bg-amber-100 text-amber-600' : 'bg-brand-100 text-brand-600',
          )}
        >
          {isPending ? <Hourglass className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">
          {isPending ? 'You’re on the waitlist' : 'Booking confirmed!'}
        </h1>
        <p className="mt-1 text-muted">
          {isPending
            ? 'This slot overlaps an existing booking. You’ll be confirmed automatically if it frees up.'
            : 'Your charging slot is reserved. See you there!'}
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-muted">{booking.bookingCode}</span>
          <StatusBadge status={booking.status} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-ink">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span className="font-semibold">{chargerName}</span>
          </div>
          {charger && (
            <a
              href={directionsUrl(charger)}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              <Navigation className="h-4 w-4" /> Directions
            </a>
          )}
        </div>

        <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
          <Row icon={<CalendarClock className="h-4 w-4" />} label="When">
            {relativeDayLabel(booking.startTime)}, {formatTimeRange(booking.startTime, booking.endTime)}
          </Row>
          <Row icon={<Clock className="h-4 w-4" />} label="Duration">
            {formatDuration(booking.durationMinutes)}
          </Row>
          <Row icon={<Zap className="h-4 w-4" />} label="Estimated energy">
            {formatEnergy(booking.estimatedEnergyKWh)}
          </Row>
          <Row icon={<span className="text-sm font-semibold">₹</span>} label="Estimated cost">
            {formatCurrency(booking.estimatedCost)}
          </Row>
          {isPending && booking.queuePosition != null && (
            <Row icon={<Hourglass className="h-4 w-4" />} label="Queue position">
              #{booking.queuePosition}
            </Row>
          )}
        </dl>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to="/app/bookings"
          className={cn(buttonClasses({ variant: 'primary' }), 'flex-1')}
        >
          View my bookings
        </Link>
        <Link
          to="/app/chargers"
          className={cn(buttonClasses({ variant: 'outline' }), 'flex-1')}
        >
          Find more chargers
        </Link>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-brand-600">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  );
}
