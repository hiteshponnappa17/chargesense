import { Badge } from '@/components/ui/Badge';
import { BOOKING_STATUS_META } from '@/lib/constants';
import type { BookingStatus } from '@/types';

export function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
