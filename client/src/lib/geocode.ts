// ---------------------------------------------------------------------------
// Address search (geocoding). Keyless by default via OpenStreetMap/Nominatim;
// auto-upgrades to Google's Geocoder when the Google Maps JS SDK is already
// loaded on the page (i.e. a Google map is in use because a key is configured).
// ---------------------------------------------------------------------------
/// <reference types="google.maps" />

export interface GeoResult {
  label: string;
  latitude: number;
  longitude: number;
}

/** Narrow access to the Google Maps SDK if it happens to be loaded. */
function googleMaps(): typeof google.maps | null {
  const g = (window as unknown as { google?: { maps?: typeof google.maps } }).google;
  return g?.maps ?? null;
}

async function geocodeViaGoogle(maps: typeof google.maps, query: string): Promise<GeoResult[]> {
  const geocoder = new maps.Geocoder();
  const { results } = await geocoder.geocode({
    address: query,
    componentRestrictions: { country: 'IN' },
  });
  return results.slice(0, 5).map((r) => ({
    label: r.formatted_address,
    latitude: r.geometry.location.lat(),
    longitude: r.geometry.location.lng(),
  }));
}

async function geocodeViaNominatim(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=5' +
    `&countrycodes=in&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const rows = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return rows.map((r) => ({
    label: r.display_name,
    latitude: Number(r.lat),
    longitude: Number(r.lon),
  }));
}

/**
 * Geocode a free-text address/place into candidate coordinates.
 * Returns [] for blank queries. Callers should debounce (Nominatim asks for
 * <=1 request/second) and may pass an AbortSignal to cancel stale lookups.
 */
export async function geocodeAddress(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const maps = googleMaps();
  if (maps) {
    try {
      return await geocodeViaGoogle(maps, q);
    } catch {
      // Fall through to the keyless provider if Google errors (quota, etc).
    }
  }
  return geocodeViaNominatim(q, signal);
}
