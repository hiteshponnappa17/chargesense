import { AlertTriangle, ArrowRight, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatTimeRange, relativeDayLabel } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { TimeSlot } from '@/types';

interface ConflictCardProps {
  conflict: TimeSlot;
  nextAvailableSlot: TimeSlot | null;
  onUseNextSlot?: (slot: TimeSlot) => void;
  onPickAnother?: () => void;
  className?: string;
}

/**
 * Shown when an FCFS reservation loses to an earlier request for an
 * overlapping window. Explains *why* and offers the next free slot.
 */
export function ConflictCard({
  conflict,
  nextAvailableSlot,
  onUseNextSlot,
  onPickAnother,
  className,
}: ConflictCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-card',
        className,
      )}
    >
      <div className="flex items-start gap-3 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink">That slot was just taken</h3>
          <p className="mt-1 text-sm text-muted">
            ChargeSense confirms bookings first-come, first-served. Another driver reserved an
            overlapping window before your request, so this time is no longer available.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-inset ring-amber-200">
            <CalendarClock className="h-4 w-4 text-amber-600" />
            <span className="text-muted">Requested:</span>
            <span className="font-medium text-ink">
              {relativeDayLabel(conflict.startTime)}, {formatTimeRange(conflict.startTime, conflict.endTime)}
            </span>
          </div>
        </div>
      </div>

      {nextAvailableSlot ? (
        <div className="border-t border-amber-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Next available slot
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <CalendarClock className="h-4 w-4" />
              </span>
              <span className="font-semibold text-ink">
                {relativeDayLabel(nextAvailableSlot.startTime)},{' '}
                {formatTimeRange(nextAvailableSlot.startTime, nextAvailableSlot.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onPickAnother && (
                <Button variant="ghost" size="sm" onClick={onPickAnother}>
                  Pick another time
                </Button>
              )}
              {onUseNextSlot && (
                <Button
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => onUseNextSlot(nextAvailableSlot)}
                >
                  Use this slot
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        onPickAnother && (
          <div className="flex justify-end border-t border-amber-200 bg-white p-4">
            <Button variant="secondary" size="sm" onClick={onPickAnother}>
              Pick another time
            </Button>
          </div>
        )
      )}
    </div>
  );
}
