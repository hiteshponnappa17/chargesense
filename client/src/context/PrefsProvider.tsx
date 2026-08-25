import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  PrefsContext,
  DEFAULT_RADIUS_KM,
  type PrefLocation,
  type PrefsContextValue,
} from './prefs-context';

const STORAGE_KEY = 'cs_prefs';

interface StoredPrefs {
  location: PrefLocation | null;
  radiusKm: number;
  selectedCarId: string;
}

function readStored(): StoredPrefs {
  const fallback: StoredPrefs = { location: null, radiusKm: DEFAULT_RADIUS_KM, selectedCarId: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    return {
      location:
        parsed.location &&
        typeof parsed.location.latitude === 'number' &&
        typeof parsed.location.longitude === 'number'
          ? parsed.location
          : null,
      radiusKm: typeof parsed.radiusKm === 'number' ? parsed.radiusKm : DEFAULT_RADIUS_KM,
      selectedCarId: typeof parsed.selectedCarId === 'string' ? parsed.selectedCarId : '',
    };
  } catch {
    return fallback;
  }
}

/**
 * Driver-side preferences shared across pages: search origin, radius, and the
 * selected EV. Persisted to localStorage so a driver's location survives reloads
 * and is available to the charger list, compatibility badges and recommendations.
 */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readStored, []);
  const [location, setLocation] = useState<PrefLocation | null>(initial.location);
  const [radiusKm, setRadius] = useState<number>(initial.radiusKm);
  const [selectedCarId, setCar] = useState<string>(initial.selectedCarId);
  const [locating, setLocating] = useState(false);

  // Persist whenever any preference changes.
  useEffect(() => {
    const toStore: StoredPrefs = { location, radiusKm, selectedCarId };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore quota/serialization errors — prefs are best-effort.
    }
  }, [location, radiusKm, selectedCarId]);

  const setFromSearch = useCallback((loc: PrefLocation) => setLocation(loc), []);
  const clearLocation = useCallback(() => setLocation(null), []);
  const setRadiusKm = useCallback((km: number) => setRadius(km), []);
  const setSelectedCarId = useCallback((carId: string) => setCar(carId), []);

  const setFromGPS = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Location is not supported on this device.'));
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            label: 'My current location',
          });
          setLocating(false);
          resolve();
        },
        (err) => {
          setLocating(false);
          reject(
            new Error(
              err.code === err.PERMISSION_DENIED
                ? 'Location permission was denied. Allow it or search an address instead.'
                : 'Could not get your location. Try again or search an address.',
            ),
          );
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
      );
    });
  }, []);

  const value = useMemo<PrefsContextValue>(
    () => ({
      location,
      radiusKm,
      selectedCarId,
      locating,
      setFromSearch,
      setFromGPS,
      clearLocation,
      setRadiusKm,
      setSelectedCarId,
    }),
    [location, radiusKm, selectedCarId, locating, setFromSearch, setFromGPS, clearLocation, setRadiusKm, setSelectedCarId],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}
