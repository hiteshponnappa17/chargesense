import { cn } from '@/lib/cn';
import { CONNECTOR_META } from '@/lib/constants';
import type { ConnectorType } from '@/types';

export function ConnectorBadge({ type, className }: { type: ConnectorType; className?: string }) {
  const meta = CONNECTOR_META[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-ink',
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}
