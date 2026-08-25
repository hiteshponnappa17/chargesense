import { hasGoogleMaps } from '@/lib/maps';
import type { Charger } from '@/types';
import { LeafletChargersMap } from './LeafletChargersMap';
import { GoogleChargersMap } from './GoogleChargersMap';

/**
 * Shared contract for both map backends.
 *
 * Display mode (default): renders every charger as a pin; clicking one calls
 * `onSelectCharger` and the map frames/pans to the selection.
 *
 * Picker mode (`interactive` + `onPick`): a single draggable pin. Map clicks and
 * pin drags report the new coordinate via `onPick`; the map only pans (never
 * re-fits/zooms) so it doesn't fight the user while they place the pin.
 */
export interface ChargersMapProps {
  chargers: Charger[];
  selectedId?: string | null;
  onSelectCharger?: (id: string) => void;
  className?: string;
  interactive?: boolean;
  onPick?: (lat: number, lng: number) => void;
  /** Optional "you are here" marker for the driver's chosen search origin. */
  userLocation?: { latitude: number; longitude: number } | null;
}

/**
 * Provider-adapter router: uses Google Maps when a key is configured
 * (`VITE_GOOGLE_MAPS_API_KEY`), otherwise the Leaflet/OpenStreetMap backend.
 * The Google backend itself falls back to Leaflet if the API fails to load, so
 * the map always renders.
 */
export function ChargersMap(props: ChargersMapProps) {
  return hasGoogleMaps() ? <GoogleChargersMap {...props} /> : <LeafletChargersMap {...props} />;
}
