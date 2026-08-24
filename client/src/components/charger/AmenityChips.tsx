import { Bath, Camera, Car, Clock, Coffee, Umbrella, Wifi, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Amenity } from '@/types';

const AMENITY_ICON: Record<Amenity, LucideIcon> = {
  Parking: Car,
  Covered: Umbrella,
  'Security Camera': Camera,
  '24/7 Access': Clock,
  'Wi-Fi': Wifi,
  Restroom: Bath,
  Cafe: Coffee,
};

export function AmenityChips({
  amenities,
  limit,
  className,
}: {
  amenities: Amenity[];
  limit?: number;
  className?: string;
}) {
  if (!amenities?.length) return null;
  const shown = limit ? amenities.slice(0, limit) : amenities;
  const extra = limit ? amenities.length - shown.length : 0;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {shown.map((a) => {
        const Icon = AMENITY_ICON[a];
        return (
          <span
            key={a}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-muted ring-1 ring-inset ring-line"
          >
            <Icon className="h-3.5 w-3.5" />
            {a}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-1 text-xs text-muted ring-1 ring-inset ring-line">
          +{extra} more
        </span>
      )}
    </div>
  );
}
