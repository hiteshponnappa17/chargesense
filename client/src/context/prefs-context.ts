import { createContext } from 'react';

/** A chosen origin for distance/radius search. */
export interface PrefLocation {
  latitude: number;
  longitude: number;
  label: string;
}

export interface PrefsContextValue {
  /** Where the driver wants to charge (null until set via GPS/search). */
  location: PrefLocation | null;
  /** Search radius in km. */
  radiusKm: number;
  /** Selected EV (CarModel id) for compatibility + recommendations, or ''. */
  selectedCarId: string;
  /** True while a GPS lookup is in flight. */
  locating: boolean;

  setFromSearch: (loc: PrefLocation) => void;
  /** Resolve the browser's current position; rejects with a friendly message. */
  setFromGPS: () => Promise<void>;
  clearLocation: () => void;
  setRadiusKm: (km: number) => void;
  setSelectedCarId: (carId: string) => void;
}

export const RADIUS_OPTIONS = [2, 5, 10, 25] as const;
export const DEFAULT_RADIUS_KM = 5;

export const PrefsContext = createContext<PrefsContextValue | undefined>(undefined);
