import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { STAGES } from '@/lib/admin/constants';
import { cn } from '@/lib/utils/cn';
import { ResultsForm } from './results-form';

type LB = { rank: number; squad_name: string; tag: string | null; rounds_played: number; booyahs: number; kills: number; points: number };
export default async function ResultsAdmin({ searchParams }: { searchParams: { t?: string; stage?: string; round?: string } }) {
  const ctx = await adminPage('/admin/results'); if (!ctx) notFound();
  const { data: ts } = await ctx.supabase.from('tournaments').select('id,name,slug,kill_points').order('created_at', { ascending: false });
  const t = ts?.find((x) => x.id === searchParams.t) ?? ts?.[0];
  const stage = (STAGES as readonly string[]).includes(searchParams.stage ?? '') ? searchParams.stage! : 'GRAND_FINAL';
  const round = Math.min(99, Math.max(1, Number(searchParams.round) || 1));
  if (!t || !isUuid(t.id)) return <main><h1 className="font-display text-2xl font-black">RESULTS</h1><p className="mt-4 text-sm text-steel">Create a tournament first.</p></main>;
  const [{ data: squads }, { data: res }, { data: lb }] = await Promise.all([
    ctx.supabase.from('squad_registrations').select('id,squad_name,tag').eq('tournament_id', t.id).eq('status', 'CONFIRMED').order('squad_name'),
    ctx.supabase.from('nx_results').select('registration_id,placement,kills').eq('tournament_id', t.id).eq('stage', stage).eq('round', round),
    ctx.supabase.rpc('nx_leaderboard', { p_tournament: t.id, p_stage: stage }),
  ]);
  const values = Object.fromEntries((res ?? []).map((r) => [r.registration_id, { placement: r.placement, kills: r.kills }]));
  const q = (o: Record<string, string | number>) => `/admin/results?${new URLSearchParams({ t: t.id, stage, round: String(round), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) })}`;
  return (
    <main className="max-w-4xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">RESULTS</h1>
      <nav className="flex flex-wrap gap-3 text-[11px] font-bold tracking-wider2">{(ts ?? []).map((x) => <Link key={x.id} href={q({ t: x.id })} className={x.id === t.id ? 'text-gold' : 'text-steel-light hover:text-white'}>{x.name}</Link>)}</nav>
      <nav className="flex flex-wrap gap-2">{STAGES.map((s) => <Link key={s} href={q({ stage: s, round: 1 })} className={cn('border px-3 py-1.5 text-[11px] font-bold tracking-wider2', s === stage ? 'border-gold bg-gold text-black' : 'border-white/20 text-steel-light')}>{s.replace(/_/g, ' ')}</Link>)}</nav>
      <nav aria-label="Round" className="flex flex-wrap gap-1">{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <Link key={n} href={q({ round: n })} className={cn('w-9 border py-1.5 text-center text-xs font-bold', n === round ? 'border-gold bg-gold text-black' : 'border-white/20 text-steel-light')}>{n}</Link>)}</nav>
      {(squads ?? []).length ? <ResultsForm t={t.id} stage={stage} round={round} squads={squads!} values={values} /> : <p className="border border-dashed border-white/15 p-6 text-sm text-steel">No CONFIRMED squads yet. Confirm payments in Registrations first.</p>}
      <p className="text-[11px] text-steel">Points = placement points + kills × {t.kill_points ?? 1} (configured on the tournament). Leave placement empty to remove a squad from the round.</p>
      <section className="border border-white/10 bg-ink-800/80 p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[11px] font-bold tracking-wider2 text-gold">LEADERBOARD · {stage.replace(/_/g, ' ')}</h2>
        <span className="flex gap-3 text-[11px] font-bold tracking-wider2"><a className="text-steel-light hover:text-gold" href={`/tournaments/${t.slug}/leaderboard?stage=${stage}&format=story`} target="_blank" rel="noopener noreferrer">STORY IMAGE ↗</a><a className="text-steel-light hover:text-gold" href={`/tournaments/${t.slug}/leaderboard?stage=${stage}&format=post`} target="_blank" rel="noopener noreferrer">POST IMAGE ↗</a></span></div>
        {(lb as LB[] | null)?.length ? <table className="w-full text-sm"><thead className="text-left text-[10px] tracking-wider2 text-steel"><tr><th className="py-1">#</th><th>SQUAD</th><th>RDS</th><th>B</th><th>KILLS</th><th>PTS</th></tr></thead><tbody className="divide-y divide-white/10">{(lb as LB[]).map((r) => <tr key={r.rank + r.squad_name}><td className="py-2 font-bold text-gold">{r.rank}</td><td>{r.squad_name}</td><td>{r.rounds_played}</td><td>{r.booyahs}</td><td>{r.kills}</td><td className="font-bold">{Number(r.points)}</td></tr>)}</tbody></table> : <p className="text-xs text-steel">No results for this stage yet.</p>}</section>
    </main>
  );
}
