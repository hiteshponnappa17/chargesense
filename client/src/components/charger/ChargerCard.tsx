import { Link } from 'react-router-dom';
import { Gauge, MapPin, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { ConnectorBadge } from './ConnectorBadge';
import { AmenityChips } from './AmenityChips';
import { CONNECTOR_META, chargerSpeedTier } from '@/lib/constants';
import { formatCurrency, formatDistance } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Charger } from '@/types';

export function ChargerCard({ charger }: { charger: Charger }) {
  const tier = chargerSpeedTier(charger.powerKW);
  const accent = CONNECTOR_META[charger.connectorType].color;
  const distance = formatDistance(charger.distanceKm ?? null);

  return (
    <div className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accent }}
        >
          <Zap className="h-5 w-5 fill-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-ink">{charger.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{charger.address}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-ink">{formatCurrency(charger.pricePerKWh)}</p>
          <p className="text-xs text-muted">per kWh</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge tone={tier.tone} icon={<Gauge className="h-3 w-3" />}>
          {tier.label} · {charger.powerKW} kW
        </Badge>
        <ConnectorBadge type={charger.connectorType} />
        {charger.isOpenNow ? (
          <Badge tone="green">Open now</Badge>
        ) : (
          <Badge tone="slate">Closed now</Badge>
        )}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {charger.rating.toFixed(1)}
          <span className="text-muted/70">({charger.reviewCount})</span>
        </span>
      </div>

      {charger.amenities.length > 0 && (
        <AmenityChips amenities={charger.amenities} limit={3} className="mt-4" />
      )}

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-xs text-muted">
          {distance ? `${distance} away` : `${charger.availableFrom}–${charger.availableUntil} IST`}
        </span>
        <Link
          to={`/app/chargers/${charger._id}`}
          className={cn(buttonClasses({ variant: 'primary', size: 'sm' }))}
        >
          View &amp; book
        </Link>
      </div>
    </div>
  );
}
