import { Badge } from './badge';
const map: Record<string, 'neutral' | 'gold' | 'live' | 'success' | 'danger'> = {
  UPCOMING: 'gold', LIVE: 'live', COMPLETED: 'neutral', PENDING: 'gold', PAYMENT_PENDING: 'gold',
  CONFIRMED: 'success', REJECTED: 'danger', REFUNDED: 'neutral', CANCELLED: 'danger', ENDED: 'neutral',
};
/** Never rely on colour alone: label text is always shown. */
export function StatusBadge({ status }: { status: string }) {
  const live = status === 'LIVE';
  return <Badge tone={map[status] ?? 'neutral'}>{live && <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}{status.replace(/_/g, ' ')}</Badge>;
}
