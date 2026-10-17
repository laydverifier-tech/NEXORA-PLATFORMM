import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { BarChart, RankList, Stat } from '@/components/admin/charts';
import { LocalTime } from '@/components/shared/local-time';
import { cn } from '@/lib/utils/cn';

type Analytics = {
  days: number; totals: Record<'views' | 'visitors' | 'tournament_views' | 'giveaway_views' | 'sponsor_clicks' | 'media_views', number>;
  daily: { day: string; views: number; visitors: number }[]; top_pages: { path: string; views: number }[];
  devices: { name: string; n: number }[]; countries: { name: string; n: number }[]; referrers: { name: string; n: number }[];
};
type Overview = Record<'unread_messages' | 'messages' | 'roster' | 'tournaments' | 'news' | 'users' | 'registrations' | 'giveaways', number>;
const RANGES = [7, 30, 90];

export default async function DashboardPage({ searchParams }: { searchParams: { days?: string } }) {
  const ctx = await adminPage('/admin/dashboard');
  if (!ctx) notFound();
  const days = RANGES.includes(Number(searchParams.days)) ? Number(searchParams.days) : 30;
  const [an, ov, msgs, logs] = await Promise.all([
    ctx.supabase.rpc('nx_admin_analytics', { p_days: days }),
    ctx.supabase.rpc('nx_admin_overview'),
    ctx.supabase.from('contact_messages').select('id,name,subject,created_at,is_read').order('created_at', { ascending: false }).limit(5),
    ctx.supabase.from('activity_logs').select('id,action,entity_type,created_at').order('created_at', { ascending: false }).limit(8),
  ]);
  const a = an.data as Analytics | null; const o = ov.data as Overview | null;
  const chart = (a?.daily ?? []).map((d) => ({ label: d.day.slice(5), value: d.views, sub: d.visitors }));
  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">CONTROL CENTER</h1><p className="mt-1 text-xs text-steel">Real data only. Visitors are counted from a salted IP hash; raw IP addresses are never stored.</p></div>
        <nav aria-label="Range" className="flex gap-2">{RANGES.map((r) => <Link key={r} href={`/admin/dashboard?days=${r}`} aria-current={r === days ? 'page' : undefined} className={cn('border px-3 py-1.5 text-[11px] font-bold tracking-wider2', r === days ? 'border-gold bg-gold text-black' : 'border-white/20 text-steel-light hover:border-gold')}>{r}D</Link>)}</nav>
      </div>
      {(an.error || ov.error) && <p role="alert" className="border border-red-500/40 p-3 text-sm text-red-300">Analytics unavailable ({(an.error ?? ov.error)?.message}). Check that the latest migration is applied.</p>}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="PAGE VIEWS" value={a?.totals.views ?? 0} hint={`last ${days} days`} /><Stat label="UNIQUE VISITORS" value={a?.totals.visitors ?? 0} /><Stat label="TOURNAMENT VIEWS" value={a?.totals.tournament_views ?? 0} /><Stat label="SPONSOR CLICKS" value={a?.totals.sponsor_clicks ?? 0} />
        <Stat label="REGISTRATIONS" value={o?.registrations ?? 0} /><Stat label="UNREAD MESSAGES" value={o?.unread_messages ?? 0} hint={`${o?.messages ?? 0} total`} /><Stat label="TOURNAMENTS" value={o?.tournaments ?? 0} /><Stat label="ROSTER / NEWS" value={`${o?.roster ?? 0} / ${o?.news ?? 0}`} />
      </section>
      <section className="border border-white/10 bg-ink-800/80 p-5"><h2 className="mb-3 text-[11px] font-bold tracking-wider2 text-gold">PAGE VIEWS PER DAY</h2>{chart.length ? <BarChart data={chart} label={`Page views per day, last ${days} days`} /> : <p className="text-xs text-steel">No traffic recorded yet.</p>}</section>
      <section className="grid gap-4 lg:grid-cols-4">
        <RankList title="TOP PAGES" rows={(a?.top_pages ?? []).map((p) => ({ name: p.path, n: p.views }))} />
        <RankList title="DEVICES" rows={a?.devices ?? []} /><RankList title="COUNTRIES" rows={a?.countries ?? []} empty="Needs a host that sends the visitor country (Vercel/Cloudflare)" /><RankList title="REFERRERS" rows={a?.referrers ?? []} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-white/10 bg-ink-800/80 p-5"><div className="mb-3 flex justify-between"><h2 className="text-[11px] font-bold tracking-wider2 text-gold">LATEST MESSAGES</h2><Link href="/admin/messages" className="text-[11px] text-steel-light hover:text-gold">VIEW ALL →</Link></div>
          {(msgs.data ?? []).length ? <ul className="divide-y divide-white/10 text-sm">{msgs.data!.map((m) => <li key={m.id} className="flex justify-between gap-3 py-2"><span className={m.is_read ? 'text-steel' : 'font-bold'}>{m.subject} <span className="text-steel">· {m.name}</span></span><span className="shrink-0 text-xs text-steel"><LocalTime iso={m.created_at} withTime={false} /></span></li>)}</ul> : <p className="text-xs text-steel">No messages yet.</p>}</div>
        <div className="border border-white/10 bg-ink-800/80 p-5"><div className="mb-3 flex justify-between"><h2 className="text-[11px] font-bold tracking-wider2 text-gold">RECENT ACTIVITY</h2><Link href="/admin/security" className="text-[11px] text-steel-light hover:text-gold">AUDIT LOG →</Link></div>
          {(logs.data ?? []).length ? <ul className="divide-y divide-white/10 text-sm">{logs.data!.map((l) => <li key={l.id} className="flex justify-between gap-3 py-2"><span className="font-mono text-xs">{l.action}</span><span className="shrink-0 text-xs text-steel"><LocalTime iso={l.created_at} /></span></li>)}</ul> : <p className="text-xs text-steel">No activity yet.</p>}</div>
      </section>
    </main>
  );
}
