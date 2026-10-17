import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { ConfirmButton } from '@/components/admin/form-kit';
import { StatusBadge } from '@/components/ui/status-badge';
import { LocalTime } from '@/components/shared/local-time';
import { GiveawayForm, type GForm } from '../giveaway-form';
import { cancelGiveaway, drawGiveaway, publishGiveaway } from '../actions';
import { Button } from '@/components/ui/button';

export default async function EditGiveaway({ params, searchParams }: { params: { id: string }; searchParams: { saved?: string; drawn?: string; err?: string } }) {
  const ctx = await adminPage(`/admin/giveaways/${params.id}`); if (!ctx || !isUuid(params.id)) notFound();
  const { data } = await ctx.supabase.from('giveaways').select('*').eq('id', params.id).limit(1);
  const g = data?.[0]; if (!g) notFound();
  const [{ data: entries }, { data: winners }] = await Promise.all([
    ctx.supabase.from('giveaway_entries').select('id,contact,created_at').eq('giveaway_id', g.id).order('created_at', { ascending: false }).limit(30),
    ctx.supabase.from('giveaway_winners').select('entry_id,selected_at').eq('giveaway_id', g.id),
  ]);
  const wIds = (winners ?? []).map((w) => w.entry_id);
  const { data: wEntries } = wIds.length ? await ctx.supabase.from('giveaway_entries').select('id,contact').in('id', wIds) : { data: [] };
  const ended = new Date(g.ends_at) <= new Date();
  const canDraw = ['LIVE', 'ENDED'].includes(g.status) && ended && !(winners ?? []).length && g.entries_count > 0;
  async function draw(fd: FormData) { 'use server'; fd.set('id', params.id); await drawGiveaway(fd); }
  async function cancel(fd: FormData) { 'use server'; fd.set('id', params.id); await cancelGiveaway(fd); }
  async function publish(fd: FormData) { 'use server'; fd.set('id', params.id); await publishGiveaway(fd); }
  return (
    <main className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">{g.title}</h1><StatusBadge status={String(g.status)} /></div>
      {searchParams.saved && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Saved.</p>}
      {searchParams.drawn && <p role="status" className="border border-gold/50 bg-gold/10 p-3 text-sm text-gold">Draw complete: {searchParams.drawn} winner(s) selected and logged.</p>}
      {searchParams.err && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{searchParams.err}</p>}
      <div className="flex flex-wrap gap-3">
        {['DRAFT', 'UPCOMING'].includes(g.status) && <form action={publish}><Button type="submit">PUBLISH (GO LIVE)</Button></form>}
        {canDraw && <ConfirmButton label="DRAW WINNER" message="Draw the winner(s) now? This is final and cannot be repeated." action={draw} />}
        {['DRAFT', 'UPCOMING', 'LIVE'].includes(g.status) && <ConfirmButton label="CANCEL GIVEAWAY" message="Cancel this giveaway?" action={cancel} />}
      </div>
      {!canDraw && ['LIVE'].includes(g.status) && <p className="text-xs text-steel">The draw unlocks once the end time has passed (checked with the database clock) and there is at least one entry.</p>}
      <p className="text-sm text-steel-light">{g.entries_count} entries · ends <LocalTime iso={g.ends_at} /></p>
      {!!wEntries?.length && <section className="border border-gold/40 bg-gold/5 p-5"><h2 className="text-[11px] font-bold tracking-wider2 text-gold">WINNER{wEntries.length > 1 ? 'S' : ''} (private details)</h2><ul className="mt-2 space-y-1 font-mono text-sm">{wEntries.map((e) => <li key={e.id}>{e.contact}</li>)}</ul></section>}
      <GiveawayForm g={g as GForm} />
      <section className="border border-white/10 bg-ink-800/80 p-5"><h2 className="mb-3 text-[11px] font-bold tracking-wider2 text-gold">LATEST ENTRIES</h2>
        {(entries ?? []).length ? <ul className="divide-y divide-white/10 text-sm">{entries!.map((e) => <li key={e.id} className="flex justify-between gap-3 py-2"><span className="font-mono">{e.contact}</span><span className="text-xs text-steel"><LocalTime iso={e.created_at} /></span></li>)}</ul> : <p className="text-xs text-steel">No entries yet.</p>}</section>
    </main>
  );
}
