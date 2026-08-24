import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, Pencil, PlugZap, Power, Trash2, Zap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConnectorBadge } from '@/components/charger/ConnectorBadge';
import { useToast } from '@/hooks/useToast';
import { deleteCharger, updateCharger } from '@/services/charger.service';
import { getHostChargers } from '@/services/host.service';
import { errorMessage } from '@/lib/api';
import { CHARGER_STATUS_META, chargerSpeedTier } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import type { HostCharger } from '@/types';

export default function HostChargers() {
  const toast = useToast();
  const [chargers, setChargers] = useState<HostCharger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HostCharger | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getHostChargers()
      .then(setChargers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const toggleStatus = async (charger: HostCharger) => {
    const next = charger.status === 'active' ? 'inactive' : 'active';
    setBusyId(charger._id);
    try {
      await updateCharger(charger._id, { status: next });
      toast.success(next === 'active' ? 'Charger enabled' : 'Charger disabled');
      load();
    } catch (err) {
      toast.error('Could not update', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteCharger(deleteTarget._id);
      if (res.deleted) {
        toast.success('Charger deleted');
      } else if (res.disabled) {
        toast.info(
          'Charger disabled instead',
          `It has ${res.activeBookings} active booking(s), so it was disabled rather than deleted.`,
        );
      }
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error('Could not delete', errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My chargers"
        subtitle="Manage your listings, availability and pricing."
        actions={
          <Link to="/host/chargers/new" className={buttonClasses({ variant: 'primary' })}>
            Add charger
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : chargers.length === 0 ? (
        <EmptyState
          icon={PlugZap}
          title="No chargers yet"
          description="List your first charger to start accepting bookings and earning."
          action={
            <Link to="/host/chargers/new" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              Add your first charger
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {chargers.map((c) => {
            const tier = chargerSpeedTier(c.powerKW);
            const statusMeta = CHARGER_STATUS_META[c.status];
            return (
              <Card key={c._id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <Zap className="h-5 w-5 fill-white" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-ink">{c.name}</h3>
                      <p className="text-sm text-muted">{c.city}</p>
                    </div>
                  </div>
                  <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge tone={tier.tone} icon={<Gauge className="h-3 w-3" />}>
                    {c.powerKW} kW
                  </Badge>
                  <ConnectorBadge type={c.connectorType} />
                  <Badge tone="slate">{formatCurrency(c.pricePerKWh)}/kWh</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                  <MiniStat label="Bookings" value={c.bookingCount} />
                  <MiniStat label="Confirmed" value={c.confirmedCount} />
                  <MiniStat label="Earnings" value={formatCurrency(c.estimatedEarnings)} />
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                  <Link
                    to={`/host/chargers/${c._id}/edit`}
                    className={buttonClasses({ variant: 'outline', size: 'sm' })}
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={busyId === c._id}
                    onClick={() => toggleStatus(c)}
                  >
                    <Power className="h-4 w-4" />
                    {c.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(c)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this charger?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed. If it has active bookings, it will be disabled instead of deleted.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
