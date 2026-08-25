import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Navigation, Search, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { usePrefs } from '@/hooks/usePrefs';
import { useToast } from '@/hooks/useToast';
import { geocodeAddress, type GeoResult } from '@/lib/geocode';
import { RADIUS_OPTIONS } from '@/context/prefs-context';
import { cn } from '@/lib/cn';

/**
 * "Where do you want to charge?" — address search (keyless OSM/Nominatim, or
 * Google when configured), a "use my current location" (GPS) button, and a
 * radius selector. Reads/writes the shared driver prefs so the charger list,
 * map and recommendations all react to the same origin.
 */
export function LocationSelector({ className }: { className?: string }) {
  const { location, radiusKm, locating, setFromSearch, setFromGPS, clearLocation, setRadiusKm } =
    usePrefs();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding as the driver types (Nominatim asks for ≤1 req/sec).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const t = setTimeout(() => {
      geocodeAddress(q, controller.signal)
        .then((r) => {
          setResults(r);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 500);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  // Close the results dropdown on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (r: GeoResult) => {
    setFromSearch(r);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const useGPS = async () => {
    try {
      await setFromGPS();
      toast.success('Location set', 'Showing chargers near you.');
    } catch (err) {
      toast.error('Location unavailable', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <Card className={className}>
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-brand-600" />
        <h2 className="text-base font-semibold text-ink">Where do you want to charge?</h2>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        {/* Address search + results dropdown */}
        <div ref={boxRef} className="relative">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Search className="h-4 w-4" />
            </span>
            <input
              className="input-base pl-10 pr-10"
              placeholder="Search an address or area…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length && setOpen(true)}
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner />
              </span>
            )}
          </div>

          {open && results.length > 0 && (
            <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-card-hover">
              {results.map((r, i) => (
                <li key={`${r.latitude},${r.longitude}-${i}`}>
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <span className="text-ink">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && !searching && query.trim().length >= 3 && results.length === 0 && (
            <div className="absolute z-[1000] mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-muted shadow-card-hover">
              No matches — try a nearby landmark or city.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={useGPS}
          disabled={locating}
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-60',
          )}
        >
          {locating ? <Spinner /> : <LocateFixed className="h-4 w-4 text-brand-600" />}
          Use my location
        </button>

        <Select
          aria-label="Search radius"
          className="md:w-40"
          value={String(radiusKm)}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          options={RADIUS_OPTIONS.map((km) => ({ value: String(km), label: `Within ${km} km` }))}
        />
      </div>

      {/* Current origin readout */}
      {location && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="min-w-0 flex-1 truncate text-ink">
            {location.label}
            <span className="text-muted">
              {' '}
              · {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
          </span>
          <button
            type="button"
            onClick={clearLocation}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-slate-100 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}
    </Card>
  );
}
