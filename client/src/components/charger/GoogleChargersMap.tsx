/// <reference types="google.maps" />
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
import { CONNECTOR_META } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import { GOOGLE_MAPS_API_KEY } from '@/lib/maps';
import { cn } from '@/lib/cn';
import { LeafletChargersMap } from './LeafletChargersMap';
import type { ChargersMapProps } from './ChargersMap';

// Mysuru city centre — used when there are no chargers to frame.
const CENTER = { lat: 12.2958, lng: 76.6394 };

// Chrome-free map: no map-type/streetview/fullscreen controls, keep zoom.
const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  zoomControl: true,
  gestureHandling: 'greedy',
};

const CONTAINER_STYLE = { width: '100%', height: '100%', minHeight: '320px' } as const;

/** Teardrop pin (same art as the Leaflet map) as an SVG data URL. */
function pinDataUrl(color: string): string {
  const svg =
    `<svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>` +
    `<circle cx="15" cy="15" r="10" fill="white"/>` +
    `<path d="M16.2 8l-5.7 8.1h3.6L13 22l5.7-8.4h-3.6L16.2 8z" fill="${color}"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Google marker icon; selected pins are slightly larger and float above. */
function markerIcon(color: string, selected: boolean): google.maps.Icon {
  const s = selected ? 1.2 : 1;
  return {
    url: pinDataUrl(color),
    scaledSize: new google.maps.Size(30 * s, 40 * s),
    anchor: new google.maps.Point(15 * s, 40 * s),
  };
}

export function GoogleChargersMap(props: ChargersMapProps) {
  const { chargers, selectedId, onSelectCharger, className, interactive = false, onPick, userLocation } = props;
  const picking = interactive && Boolean(onPick);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'chargesense-gmaps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Captured once so live edits (picker) or re-renders don't reset the view;
  // subsequent framing is driven imperatively by the effects below.
  const initialView = useMemo(
    () =>
      picking && chargers[0]
        ? { center: { lat: chargers[0].latitude, lng: chargers[0].longitude }, zoom: 14 }
        : { center: CENTER, zoom: 12 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Frame to the charger set (display mode) — mirrors the Leaflet FitBounds.
  useEffect(() => {
    if (!map || picking) return;
    if (!chargers.length) {
      map.setCenter(CENTER);
      map.setZoom(12);
      return;
    }
    if (chargers.length === 1) {
      map.setCenter({ lat: chargers[0].latitude, lng: chargers[0].longitude });
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    chargers.forEach((c) => bounds.extend({ lat: c.latitude, lng: c.longitude }));
    map.fitBounds(bounds, 48);
    google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
    });
  }, [map, chargers, picking]);

  // Pan to the selected charger (display) or the moving pin (picker).
  useEffect(() => {
    if (!map) return;
    if (picking) {
      if (chargers[0]) map.panTo({ lat: chargers[0].latitude, lng: chargers[0].longitude });
      return;
    }
    if (!selectedId) return;
    const target = chargers.find((c) => c._id === selectedId);
    if (target) map.panTo({ lat: target.latitude, lng: target.longitude });
  }, [map, picking, selectedId, chargers]);

  // Resilient fallback: any load failure (bad/blocked key, network) → Leaflet.
  if (loadError) return <LeafletChargersMap {...props} />;

  if (!isLoaded) {
    return (
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-slate-50',
          className,
        )}
        style={{ minHeight: 320 }}
      >
        <span className="text-sm text-muted">Loading map…</span>
      </div>
    );
  }

  const handleMapClick = picking
    ? (e: google.maps.MapMouseEvent) => {
        if (e.latLng) onPick!(e.latLng.lat(), e.latLng.lng());
      }
    : undefined;

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line', className)}>
      <GoogleMap
        mapContainerStyle={CONTAINER_STYLE}
        center={initialView.center}
        zoom={initialView.zoom}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {!picking && userLocation && (
          <MarkerF
            position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
            zIndex={1}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
            }}
            title="You are here"
          />
        )}
        {chargers.map((charger) => {
          const color = CONNECTOR_META[charger.connectorType].color;
          const selected = charger._id === selectedId;

          if (picking) {
            return (
              <MarkerF
                key={charger._id}
                position={{ lat: charger.latitude, lng: charger.longitude }}
                icon={markerIcon(color, true)}
                draggable
                onDragEnd={(e) => {
                  if (e.latLng) onPick!(e.latLng.lat(), e.latLng.lng());
                }}
              />
            );
          }

          return (
            <MarkerF
              key={charger._id}
              position={{ lat: charger.latitude, lng: charger.longitude }}
              icon={markerIcon(color, selected)}
              zIndex={selected ? 1000 : undefined}
              onClick={() => {
                onSelectCharger?.(charger._id);
                setOpenId(charger._id);
              }}
            >
              {openId === charger._id && (
                <InfoWindowF onCloseClick={() => setOpenId(null)}>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink">{charger.name}</p>
                    <p className="text-xs text-muted">{charger.address}</p>
                    <p className="text-xs">
                      <span className="font-semibold text-ink">
                        {formatCurrency(charger.pricePerKWh)}
                      </span>
                      <span className="text-muted"> /kWh · {charger.powerKW} kW</span>
                    </p>
                    <Link
                      to={`/app/chargers/${charger._id}`}
                      className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      View &amp; book →
                    </Link>
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          );
        })}
      </GoogleMap>
    </div>
  );
}
