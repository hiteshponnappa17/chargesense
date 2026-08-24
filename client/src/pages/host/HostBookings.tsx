import { useCallback, useEffect, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookingCard } from '@/components/booking/BookingCard';
import { getHostBookings } from '@/services/host.service';
import { cn } from '@/lib/cn';
import type { Booking, BookingStatus } from '@/types';

const TABS: { key: '' | BookingStatus; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending', label: 'Waitlisted' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function HostBookings() {
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getHostBookings(status || undefined)
      .then(setBookings)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        subtitle="Reservations across all your chargers."
      />

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
          icon={CalendarRange}
          title="No bookings yet"
          description="When drivers reserve your chargers, their bookings appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookings.map((b) => (
            <BookingCard key={b._id} booking={b} context="host" />
          ))}
        </div>
      )}
    </div>
  );
}
