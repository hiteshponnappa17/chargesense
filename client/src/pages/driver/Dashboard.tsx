import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarCheck,
  IndianRupee,
  MapPin,
  PlugZap,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { BookingCard } from '@/components/booking/BookingCard';
import { StatusBadge } from '@/components/booking/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { getDriverDashboard } from '@/services/dashboard.service';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import type { DriverDashboard } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DriverDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getDriverDashboard()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi ${firstName} 👋`}
        subtitle="Here’s what’s happening with your charging."
        actions={
          <Link to="/app/chargers" className={buttonClasses({ variant: 'primary' })}>
            Find chargers
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : error || !data ? (
        <ErrorState onRetry={load} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Available chargers"
              value={data.stats.availableChargers}
              icon={PlugZap}
              tone="green"
            />
            <StatCard
              label="Upcoming bookings"
              value={data.stats.upcomingBookings}
              icon={CalendarCheck}
              tone="blue"
            />
            <StatCard
              label="Total bookings"
              value={data.stats.totalBookings}
              icon={Activity}
              tone="violet"
              hint={`${data.stats.completedBookings} completed`}
            />
            <StatCard
              label="Estimated spend"
              value={formatCurrency(data.stats.estimatedSpend)}
              icon={IndianRupee}
              tone="amber"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Next booking
              </h2>
              {data.nextBooking ? (
                <BookingCard booking={data.nextBooking} />
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  title="No upcoming bookings"
                  description="Find a charger near you and reserve a slot."
                  action={
                    <Link to="/app/chargers" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                      Browse chargers
                    </Link>
                  }
                />
              )}
            </div>

            <Card>
              <CardHeader title="Recent activity" description="Your latest bookings" />
              {data.recentActivity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No activity yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-line">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{a.chargerName}</p>
                        <p className="text-xs text-muted">
                          {formatDate(a.at)} · {formatTime(a.at)} · {a.bookingCode}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold text-ink">
                          {formatCurrency(a.amount)}
                        </span>
                        <StatusBadge status={a.type} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-brand-50 to-white">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink">Charge smarter</h3>
                  <p className="text-sm text-muted">
                    Set your default EV in your profile for faster, more accurate estimates.
                  </p>
                </div>
              </div>
              <Link
                to="/app/profile"
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                Update profile
              </Link>
            </div>
          </Card>

          <div className="flex items-center gap-2 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5" />
            <Badge tone="slate">Serving Mysuru & nearby</Badge>
          </div>
        </>
      )}
    </div>
  );
}
