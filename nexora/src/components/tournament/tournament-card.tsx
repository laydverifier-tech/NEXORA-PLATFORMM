import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LocalTime } from '@/components/shared/local-time';
import { euro, hasRealStart, isRegistrationOpen, toUiStatus } from '@/lib/utils/format';
import type { Tournament } from '@/types/content';

export function TournamentCard({ t }: { t: Tournament }) {
  return (
    <Link href={`/tournaments/${t.slug}`} className="group block focus-visible:outline-offset-4">
      <Card className="h-full transition-colors group-hover:border-gold/60">
        <div className="mb-4 flex items-center justify-between"><StatusBadge status={toUiStatus(t.status)} /><span className="text-[10px] font-bold tracking-wider2 text-steel">{t.game}</span></div>
        <h3 className="font-display text-2xl font-black tracking-wider">{t.name}</h3>
        <p className="mt-4 font-display text-5xl font-black text-gold">{euro(t.prize_pool)}</p>
        <p className="text-[10px] font-bold tracking-wider2 text-steel">PRIZE POOL</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-xs text-steel-light">
          <div><dt className="text-[10px] tracking-wider2 text-steel">DATE</dt><dd>{hasRealStart(t) ? <LocalTime iso={t.tournament_start} /> : 'TBA'}</dd></div>
          <div><dt className="text-[10px] tracking-wider2 text-steel">SLOTS</dt><dd>{t.max_teams} squads</dd></div>
          <div><dt className="text-[10px] tracking-wider2 text-steel">REGION</dt><dd>{t.region ?? '—'}</dd></div>
          <div><dt className="text-[10px] tracking-wider2 text-steel">REGISTRATION</dt><dd>{isRegistrationOpen(t) ? <>until <LocalTime iso={t.registration_end} withTime={false} /></> : t.status === 'REGISTRATION_OPEN' || t.status === 'REGISTRATION_CLOSED' ? 'Closed' : '—'}</dd></div>
        </dl>
      </Card>
    </Link>
  );
}
