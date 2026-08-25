import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { CONNECTOR_META } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Charger } from '@/types';
import type { ChargersMapProps } from './ChargersMap';

// Mysuru city centre — used when there are no chargers to frame.
const DEFAULT_CENTER: [number, number] = [12.2958, 76.6394];

function pinIcon(color: string, selected: boolean): L.DivIcon {
  const scale = selected ? 1.15 : 1;
  const ring = selected ? '<span class="cs-pin-ring"></span>' : '';
  return L.divIcon({
    className: 'cs-pin-wrap',
    html: `
      <div class="cs-pin" style="transform:scale(${scale})">
        ${ring}
        <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>
          <circle cx="15" cy="15" r="10" fill="white"/>
          <path d="M16.2 8l-5.7 8.1h3.6L13 22l5.7-8.4h-3.6L16.2 8z" fill="${color}"/>
        </svg>
      </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -34],
  });
}

/** Distinct "you are here" dot for the driver's chosen search origin. */
function userDotIcon(): L.DivIcon {
  return L.divIcon({
    className: 'cs-userdot-wrap',
    html: `<span class="cs-userdot"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Frames the map to the current set of chargers whenever it changes. */
function FitBounds({ chargers }: { chargers: Charger[] }) {
  const map = useMap();
  useEffect(() => {
    if (!chargers.length) {
      map.setView(DEFAULT_CENTER, 12);
      return;
    }
    if (chargers.length === 1) {
      map.setView([chargers[0].latitude, chargers[0].longitude], 14);
      return;
    }
    const bounds = L.latLngBounds(chargers.map((c) => [c.latitude, c.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [chargers, map]);
  return null;
}

/** Pans to the selected charger without changing zoom. */
function PanToSelected({ chargers, selectedId }: { chargers: Charger[]; selectedId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const target = chargers.find((c) => c._id === selectedId);
    if (target) map.panTo([target.latitude, target.longitude], { animate: true });
  }, [selectedId, chargers, map]);
  return null;
}

/**
 * Picker mode: pan (never re-fit/zoom) to the current pin as it moves, and turn
 * map clicks into onPick calls. Kept separate from FitBounds so live edits on
 * the host form don't fight the user by jumping/zooming.
 */
function PickerLayer({
  point,
  onPick,
}: {
  point: [number, number];
  onPick: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  useEffect(() => {
    map.panTo(point, { animate: true });
  }, [map, point]);
  return null;
}

export function LeafletChargersMap({
  chargers,
  selectedId,
  onSelectCharger,
  className,
  interactive = false,
  onPick,
  userLocation,
}: ChargersMapProps) {
  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    return (color: string, selected: boolean) => {
      const key = `${color}-${selected}`;
      let icon = cache.get(key);
      if (!icon) {
        icon = pinIcon(color, selected);
        cache.set(key, icon);
      }
      return icon;
    };
  }, []);

  const userIcon = useMemo(() => userDotIcon(), []);

  const picking = interactive && Boolean(onPick);
  // In picker mode there is exactly one pin — track it for pan + drag.
  const pickPoint: [number, number] | null =
    picking && chargers[0] ? [chargers[0].latitude, chargers[0].longitude] : null;

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line', className)}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: 320 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {picking && pickPoint ? (
          <PickerLayer point={pickPoint} onPick={onPick!} />
        ) : (
          <>
            <FitBounds chargers={chargers} />
            <PanToSelected chargers={chargers} selectedId={selectedId} />
          </>
        )}
        {!picking && userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
            zIndexOffset={-1000}
          >
            <Popup>
              <p className="text-xs font-semibold text-ink">You are here</p>
            </Popup>
          </Marker>
        )}
        {chargers.map((charger) => {
          const color = CONNECTOR_META[charger.connectorType].color;
          const selected = charger._id === selectedId;
          if (picking) {
            // Single draggable pin; drag end reports the new coordinate.
            return (
              <Marker
                key={charger._id}
                position={[charger.latitude, charger.longitude]}
                icon={icons(color, true)}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    onPick!(lat, lng);
                  },
                }}
              />
            );
          }
          return (
            <Marker
              key={charger._id}
              position={[charger.latitude, charger.longitude]}
              icon={icons(color, selected)}
              eventHandlers={{ click: () => onSelectCharger?.(charger._id) }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink">{charger.name}</p>
                  <p className="text-xs text-muted">{charger.address}</p>
                  <p className="text-xs">
                    <span className="font-semibold text-ink">{formatCurrency(charger.pricePerKWh)}</span>
                    <span className="text-muted"> /kWh · {charger.powerKW} kW</span>
                  </p>
                  <Link
                    to={`/app/chargers/${charger._id}`}
                    className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View &amp; book →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
