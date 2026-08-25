import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, Map as MapIcon, Search, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ChargerCard } from '@/components/charger/ChargerCard';
import { ChargersMap } from '@/components/charger/ChargersMap';
import { LocationSelector } from '@/components/location/LocationSelector';
import { listChargers, type ChargerFilters } from '@/services/charger.service';
import { CONNECTOR_TYPES } from '@/lib/constants';
import { usePrefs } from '@/hooks/usePrefs';
import { cn } from '@/lib/cn';
import type { Charger } from '@/types';

const NEAREST_SORT = { value: 'nearest', label: 'Nearest' };
const SORTS = [
  { value: 'rating', label: 'Top rated' },
  { value: 'price', label: 'Lowest price' },
  { value: 'power', label: 'Fastest first' },
];

export default function Chargers() {
  const { location, radiusKm } = usePrefs();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [connector, setConnector] = useState('');
  const [sort, setSort] = useState('rating');
  const [availableNow, setAvailableNow] = useState(false);

  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');

  // Debounce the free-text search.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // When the driver first sets a location, default the sort to "Nearest".
  const hadLocation = useRef(Boolean(location));
  useEffect(() => {
    if (location && !hadLocation.current) setSort('nearest');
    hadLocation.current = Boolean(location);
  }, [location]);

  const sortOptions = location ? [NEAREST_SORT, ...SORTS] : SORTS;

  const filters = useMemo<ChargerFilters>(
    () => ({
      search: debounced || undefined,
      connectorType: connector || undefined,
      sort: sort as ChargerFilters['sort'],
      availableNow: availableNow || undefined,
      lat: location?.latitude,
      lng: location?.longitude,
      radiusKm: location ? radiusKm : undefined,
    }),
    [debounced, connector, sort, availableNow, location, radiusKm],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    listChargers(filters)
      .then(setChargers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find chargers"
        subtitle="Browse hosted chargers around Mysuru and reserve a slot."
      />

      <LocationSelector />

      {/* Filters */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Search by name, area or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={[{ value: '', label: 'All connectors' }, ...CONNECTOR_TYPES.map((c) => ({ value: c, label: c }))]}
            value={connector}
            onChange={(e) => setConnector(e.target.value)}
            className="md:w-44"
          />
          <Select
            options={sortOptions}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="md:w-40"
          />
          <button
            type="button"
            onClick={() => setAvailableNow((v) => !v)}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition',
              availableNow
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-line bg-white text-muted hover:bg-slate-50',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Open now
          </button>
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm text-muted">
          {loading ? 'Loading…' : `${chargers.length} charger${chargers.length === 1 ? '' : 's'}`}
        </p>
        <div className="inline-flex rounded-xl border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
              view === 'list' ? 'bg-brand-600 text-white' : 'text-muted',
            )}
          >
            <List className="h-4 w-4" /> List
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
              view === 'map' ? 'bg-brand-600 text-white' : 'text-muted',
            )}
          >
            <MapIcon className="h-4 w-4" /> Map
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_minmax(340px,40%)] lg:gap-6">
        {/* List */}
        <div className={cn('space-y-4', view === 'map' && 'hidden lg:block')}>
          <p className="hidden text-sm text-muted lg:block">
            {loading ? 'Loading…' : `${chargers.length} charger${chargers.length === 1 ? '' : 's'} found`}
          </p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState onRetry={load} />
          ) : chargers.length === 0 ? (
            <EmptyState
              icon={Search}
              title={location ? `No chargers within ${radiusKm} km` : 'No chargers match your filters'}
              description={
                location
                  ? 'Try a larger radius, a different area, or turn off the “Open now” filter.'
                  : 'Try widening your search or turning off the “Open now” filter.'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {chargers.map((c) => (
                <div
                  key={c._id}
                  onMouseEnter={() => setSelectedId(c._id)}
                  onClick={() => setSelectedId(c._id)}
                >
                  <ChargerCard charger={c} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className={cn('mt-4 lg:mt-0', view === 'list' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-6">
            <ChargersMap
              chargers={chargers}
              selectedId={selectedId}
              onSelectCharger={setSelectedId}
              userLocation={location}
              className="h-[60vh] lg:h-[calc(100vh-8rem)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
