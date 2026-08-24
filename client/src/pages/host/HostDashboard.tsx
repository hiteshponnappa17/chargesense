import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CalendarRange,
  IndianRupee,
  PlugZap,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { buttonClasses } from '@/components/ui/Button';
import { StatusBadge } from '@/components/booking/StatusBadge';
import { getHostDashboard } from '@/services/host.service';
import { formatCurrency, formatTime, relativeDayLabel } from '@/lib/format';
import type { HostDashboard as HostDashboardData } from '@/types';

export default function HostDashboard() {
  const [data, setData] = useState<HostDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getHostDashboard()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Host dashboard"
        subtitle="Your chargers, bookings and earnings at a glance."
        actions={
          <Link to="/host/chargers/new" className={buttonClasses({ variant: 'primary' })}>
            Add charger
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
              label="Active chargers"
              value={data.stats.activeChargers}
              icon={PlugZap}
              tone="green"
              hint={`${data.stats.totalChargers} total`}
            />
            <StatCard
              label="Today’s bookings"
              value={data.stats.todaysBookings}
              icon={CalendarRange}
              tone="blue"
            />
            <StatCard
              label="This month"
              value={formatCurrency(data.stats.monthlyEarnings)}
              icon={IndianRupee}
              tone="amber"
              hint="Estimated earnings"
            />
            <StatCard
              label="Utilization"
              value={`${Math.round(data.stats.utilization)}%`}
              icon={TrendingUp}
              tone="violet"
              hint={`${data.stats.totalBookings} bookings all-time`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly earnings */}
            <Card>
              <CardHeader title="Last 7 days" description="Estimated earnings per day" />
              <div className="mt-4 h-64">
                {data.charts.week.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.week} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(22,163,74,0.06)' }}
                        formatter={(value: number | string) => [formatCurrency(Number(value)), 'Earnings']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                      />
                      <Bar dataKey="earnings" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Utilization by charger */}
            <Card>
              <CardHeader title="Utilization by charger" description="Share of hours booked" />
              <div className="mt-4 h-64">
                {data.charts.utilization.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.charts.utilization}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 12, fill: '#111827' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(22,163,74,0.06)' }}
                        formatter={(value: number | string) => [`${Math.round(Number(value))}%`, 'Utilization']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                      />
                      <Bar dataKey="utilizationPct" radius={[0, 6, 6, 0]} maxBarSize={26}>
                        {data.charts.utilization.map((entry) => (
                          <Cell key={entry.chargerId} fill="#0ea5e9" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Recent bookings */}
          <Card>
            <CardHeader
              title="Recent bookings"
              description="Latest reservations across your chargers"
              action={
                <Link to="/host/bookings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  View all →
                </Link>
              }
            />
            {data.recentBookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No bookings yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="pb-2 font-medium">Driver</th>
                      <th className="pb-2 font-medium">Charger</th>
                      <th className="pb-2 font-medium">When</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="py-3 font-medium text-ink">{b.driverName}</td>
                        <td className="py-3 text-muted">{b.chargerName}</td>
                        <td className="py-3 text-muted">
                          {relativeDayLabel(b.startTime)}, {formatTime(b.startTime)}
                        </td>
                        <td className="py-3 font-medium text-ink">{formatCurrency(b.estimatedCost)}</td>
                        <td className="py-3">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      <span className="inline-flex items-center gap-2">
        <BarChart3 className="h-4 w-4" /> No data yet
      </span>
    </div>
  );
}
