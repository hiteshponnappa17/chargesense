import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, Zap } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency,
  formatDuration,
  formatEnergy,
  formatTimeRange,
  relativeDayLabel,
} from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Booking, Charger, PopulatedUserRef } from '@/types';

function chargerOf(booking: Booking): { name: string; address?: string } {
  const c = booking.chargerId;
  if (c && typeof c === 'object') {
    const charger = c as Charger;
    return { name: charger.name, address: charger.address };
  }
  return { name: 'Charger' };
}

function driverOf(booking: Booking): string | null {
  const u = booking.userId;
  if (u && typeof u === 'object') return (u as PopulatedUserRef).name;
  return null;
}

/** A booking is cancellable while it is still upcoming and not already closed. */
export function isCancellable(booking: Booking): boolean {
  if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
  return new Date(booking.startTime).getTime() > Date.now();
}

interface BookingCardProps {
  booking: Booking;
  context?: 'driver' | 'host';
  onCancel?: (booking: Booking) => void;
  cancelling?: boolean;
  className?: string;
}

export function BookingCard({
  booking,
  context = 'driver',
  onCancel,
  cancelling,
  className,
}: BookingCardProps) {
  const charger = chargerOf(booking);
  const driver = driverOf(booking);
  const canCancel = onCancel && isCancellable(booking);

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">{booking.bookingCode}</p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-ink">{charger.name}</h3>
          {context === 'host' && driver ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <User className="h-3.5 w-3.5" /> {driver}
            </p>
          ) : charger.address ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{charger.address}</span>
            </p>
          ) : null}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted">
          <Calendar className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="text-ink">{relativeDayLabel(booking.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Clock className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="text-ink">{formatTimeRange(booking.startTime, booking.endTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Zap className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="text-ink">
            {formatEnergy(booking.estimatedEnergyKWh)} · {formatDuration(booking.durationMinutes)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <span className="text-base font-semibold text-ink">
            {formatCurrency(booking.estimatedCost)}
          </span>
          <span className="text-xs">est.</span>
        </div>
      </div>

      {context === 'driver' ? (
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <Link
            to={`/app/bookings/${booking._id}`}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View details →
          </Link>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              loading={cancelling}
              onClick={() => onCancel?.(booking)}
            >
              Cancel
            </Button>
          )}
        </div>
      ) : (
        canCancel && (
          <div className="mt-5 flex justify-end border-t border-line pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              loading={cancelling}
              onClick={() => onCancel?.(booking)}
            >
              Cancel
            </Button>
          </div>
        )
      )}
    </div>
  );
}
