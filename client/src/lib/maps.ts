// ---------------------------------------------------------------------------
// Maps helpers — provider selection + keyless Google Maps directions links.
// ---------------------------------------------------------------------------

/**
 * Google Maps JavaScript API key, read from Vite env at build time.
 * Empty string when unset → the app falls back to the Leaflet/OpenStreetMap map.
 */
export const GOOGLE_MAPS_API_KEY: string =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';

/** True when a Google Maps key is configured, so the Google backend can load. */
export function hasGoogleMaps(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0;
}

/**
 * Deep link that opens turn-by-turn directions to a coordinate in Google Maps
 * (web or the native app). Needs no API key.
 */
export function directionsUrl(dest: { latitude: number; longitude: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`;
}
