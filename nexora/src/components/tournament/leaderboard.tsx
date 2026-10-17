import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { EmptyState } from '@/components/ui/section';
import type { LeaderboardRow } from '@/services/content';

export function Leaderboard({ slug, stage, stages, rows }: { slug: string; stage: string | null; stages: string[]; rows: LeaderboardRow[] }) {
  const label = (s: string) => s.replace(/_/g, ' ');
  return (
    <div>
      {stages.length > 1 && <nav aria-label="Stage" className="mb-5 flex flex-wrap gap-2">{stages.map((s) => <Link key={s} scroll={false} href={`/tournaments/${slug}?stage=${s}#leaderboard`} aria-current={s === stage ? 'page' : undefined} className={cn('border px-3 py-1.5 text-[11px] font-bold tracking-wider2', s === stage ? 'border-gold bg-gold text-black' : 'border-white/20 text-steel-light hover:border-gold')}>{label(s)}</Link>)}</nav>}
      {rows.length ? (
        <>
          <div className="overflow-x-auto border border-white/10"><table className="w-full text-left text-sm"><caption className="sr-only">Leaderboard {stage ? label(stage) : ''}</caption>
            <thead className="bg-ink-800 text-[10px] tracking-wider2 text-steel"><tr><th className="p-3">RANK</th><th className="p-3">SQUAD</th><th className="p-3 text-right">KILLS</th><th className="p-3 text-right">B!</th><th className="p-3 text-right">PTS</th></tr></thead>
            <tbody className="divide-y divide-white/10">{rows.map((r) => <tr key={r.rank + r.squad_name} className={r.rank <= 3 ? 'bg-gold/5' : ''}><td className="p-3 font-display text-lg font-black text-gold">{r.rank}</td><td className="p-3 font-bold">{r.squad_name}{r.tag && <span className="ml-2 text-xs text-steel">[{r.tag}]</span>}</td><td className="p-3 text-right">{r.kills}</td><td className="p-3 text-right">{r.booyahs}</td><td className="p-3 text-right font-display text-lg font-black">{Number(r.points)}</td></tr>)}</tbody></table></div>
          <p className="mt-3 flex flex-wrap gap-4 text-[11px] font-bold tracking-wider2"><a className="text-steel-light hover:text-gold" href={`/tournaments/${slug}/leaderboard?${new URLSearchParams({ ...(stage ? { stage } : {}), format: 'story' })}`} target="_blank" rel="noopener noreferrer">STORY IMAGE ↗</a><a className="text-steel-light hover:text-gold" href={`/tournaments/${slug}/leaderboard?${new URLSearchParams({ ...(stage ? { stage } : {}), format: 'post' })}`} target="_blank" rel="noopener noreferrer">POST IMAGE ↗</a></p>
        </>
      ) : <EmptyState title="NO RESULTS YET" text="Official results are published after each match day." />}
    </div>
  );
}
