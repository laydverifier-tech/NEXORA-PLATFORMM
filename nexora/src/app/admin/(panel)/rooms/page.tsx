import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LocalTime } from '@/components/shared/local-time';
import { ROOM_STATUSES } from '@/lib/admin/constants';
import { RoomForm } from './room-form';
import { roomOp } from './actions';

function Op({ id, op, label, danger }: { id: string; op: string; label: string; danger?: boolean }) {
  return <form action={roomOp}><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} /><Button type="submit" variant={danger ? 'danger' : 'outline'} className="!px-3 py-1.5">{label}</Button></form>;
}
export default async function RoomsAdmin({ searchParams }: { searchParams: { t?: string } }) {
  const ctx = await adminPage('/admin/rooms'); if (!ctx) notFound();
  const { data: ts } = await ctx.supabase.from('tournaments').select('id,name').order('created_at', { ascending: false });
  const tid = isUuid(searchParams.t) ? searchParams.t : ts?.[0]?.id;
  const [{ data: rooms }, { data: regs }] = tid ? await Promise.all([
    ctx.supabase.from('nx_rooms').select('*').eq('tournament_id', tid).order('scheduled_at', { ascending: true }),
    ctx.supabase.from('squad_registrations').select('id,squad_name,captain_name,whatsapp').eq('tournament_id', tid).eq('status', 'CONFIRMED'),
  ]) : [{ data: [] }, { data: [] }];
  const tname = ts?.find((t) => t.id === tid)?.name ?? '';
  return (
    <main className="max-w-4xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">ROOMS</h1>
      <p className="text-xs text-steel">Room IDs and passwords are private. Send them to confirmed captains with the WhatsApp buttons.</p>
      <nav aria-label="Tournament" className="flex flex-wrap gap-3 text-[11px] font-bold tracking-wider2">{(ts ?? []).map((t) => <Link key={t.id} href={`/admin/rooms?t=${t.id}`} className={t.id === tid ? 'text-gold' : 'text-steel-light hover:text-white'}>{t.name}</Link>)}</nav>
      {tid && <div className="border border-white/10 bg-ink-800/80 p-5"><RoomForm tournamentId={tid} /></div>}
      <div className="space-y-4">{(rooms ?? []).map((r) => {
        const msg = `NEXORA — ${tname}\n${String(r.stage).replace(/_/g, ' ')} · ${r.name}\nRoom ID: ${r.room_id}\nPassword: ${r.room_password ?? '—'}\n${r.scheduled_at ? `Start: ${new Date(r.scheduled_at).toISOString().slice(0, 16).replace('T', ' ')} UTC\n` : ''}Good luck! #GONEXORA`;
        return (
          <article key={r.id} className="border border-white/10 bg-ink-800/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold tracking-wider2 text-gold">{String(r.stage).replace(/_/g, ' ')}</p><h2 className="font-display text-xl font-black">{r.name}</h2><p className="font-mono text-sm">ID {r.room_id} · PW {r.room_password ?? '—'}</p><p className="text-xs text-steel">{r.scheduled_at ? <LocalTime iso={r.scheduled_at} /> : 'No time set'}</p></div><StatusBadge status={String(r.status)} /></div>
            <div className="mt-3 flex flex-wrap gap-2">{ROOM_STATUSES.filter((s) => s !== r.status).map((s) => <Op key={s} id={r.id} op={s} label={s} />)}<Op id={r.id} op="delete" label="DELETE" danger /></div>
            <details className="mt-3"><summary className="cursor-pointer text-[11px] font-bold tracking-wider2 text-steel-light">SEND TO {regs?.length ?? 0} CONFIRMED CAPTAINS</summary>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">{(regs ?? []).map((g) => <li key={g.id}><a className="block border border-white/15 p-2 text-xs hover:border-gold" href={`https://wa.me/${String(g.whatsapp ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">{g.squad_name} · {g.captain_name} → WhatsApp</a></li>)}</ul></details>
          </article>);
      })}</div>
      {!rooms?.length && tid && <p className="text-sm text-steel">No rooms for this tournament yet.</p>}
    </main>
  );
}
