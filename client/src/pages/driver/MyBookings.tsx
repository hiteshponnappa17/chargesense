import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { buttonClasses } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BookingCard } from '@/components/booking/BookingCard';
import { useToast } from '@/hooks/useToast';
import { cancelBooking, listMyBookings } from '@/services/booking.service';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Booking, BookingStatus } from '@/types';

const TABS: { key: '' | BookingStatus; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending', label: 'Waitlisted' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function MyBookings() {
  const toast = useToast();
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    listMyBookings(status || undefined)
      .then(setBookings)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelBooking(cancelTarget._id);
      toast.success('Booking cancelled');
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error('Could not cancel', errorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My bookings"
        subtitle="Track and manage your charging reservations."
        actions={
          <Link to="/app/chargers" className={buttonClasses({ variant: 'primary' })}>
            Find chargers
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key || 'all'}
            type="button"
            onClick={() => setStatus(t.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
              status === t.key
                ? 'bg-ink text-white'
                : 'bg-white text-muted ring-1 ring-inset ring-line hover:bg-slate-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings here yet"
          description="When you reserve a charging slot, it’ll show up here."
          action={
            <Link to="/app/chargers" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              Browse chargers
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookings.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              onCancel={setCancelTarget}
              cancelling={cancelling && cancelTarget?._id === b._id}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this booking?"
        message={
          cancelTarget
            ? `Booking ${cancelTarget.bookingCode} will be cancelled. This can’t be undone.`
            : ''
        }
        confirmLabel="Cancel booking"
        cancelLabel="Keep it"
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => (cancelling ? null : setCancelTarget(null))}
      />
    </div>
  );
}
