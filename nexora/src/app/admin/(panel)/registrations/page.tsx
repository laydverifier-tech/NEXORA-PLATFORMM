import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { LocalTime } from '@/components/shared/local-time';
import { isUuid } from '@/lib/admin/helpers';
import { setRegistration } from './actions';

type Reg = { id: string; tournament_id: string; squad_name: string; tag: string | null; captain_name: string; whatsapp: string | null; discord: string | null; tier: string; status: string; payment_status: string; order_id: string | null; players: { nickname?: string; uid?: string }[]; created_at: string };
function Op({ id, op, label, danger }: { id: string; op: string; label: string; danger?: boolean }) {
  return <form action={setRegistration}><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} /><Button type="submit" variant={danger ? 'danger' : 'outline'} className="!px-3 py-1.5">{label}</Button></form>;
}
export default async function RegistrationsAdmin({ searchParams }: { searchParams: { t?: string } }) {
  const ctx = await adminPage('/admin/registrations'); if (!ctx) notFound();
  const tid = isUuid(searchParams.t) ? searchParams.t : null;
  let q = ctx.supabase.from('squad_registrations').select('id,tournament_id,squad_name,tag,captain_name,whatsapp,discord,tier,status,payment_status,order_id,players,created_at').order('created_at', { ascending: false }).limit(300);
  if (tid) q = q.eq('tournament_id', tid);
  const [{ data }, { data: ts }] = await Promise.all([q, ctx.supabase.from('tournaments').select('id,name').order('created_at', { ascending: false })]);
  const names = Object.fromEntries((ts ?? []).map((t) => [t.id, t.name]));
  const rows = (data ?? []) as Reg[];
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">REGISTRATIONS</h1><a href={`/admin/registrations/export${tid ? `?t=${tid}` : ''}`} className="border border-white/25 px-4 py-2 text-[11px] font-bold tracking-wider2 hover:border-gold hover:text-gold">EXPORT CSV</a></div>
      <nav aria-label="Filter" className="flex flex-wrap gap-2 text-[11px] font-bold tracking-wider2"><Link href="/admin/registrations" className={!tid ? 'text-gold' : 'text-steel-light'}>ALL</Link>{(ts ?? []).map((t) => <Link key={t.id} href={`/admin/registrations?t=${t.id}`} className={tid === t.id ? 'text-gold' : 'text-steel-light hover:text-white'}>{t.name}</Link>)}</nav>
      {!rows.length && <p className="border border-dashed border-white/15 p-8 text-center text-sm text-steel">No registrations yet.</p>}
      <div className="space-y-3">{rows.map((r) => (
        <article key={r.id} className="min-w-0 break-words border border-white/10 bg-ink-800/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><p className="font-mono text-[11px] text-gold">{r.order_id ?? '—'} · {names[r.tournament_id] ?? ''}</p><h2 className="font-display text-xl font-black">{r.squad_name}{r.tag ? ` [${r.tag}]` : ''}</h2>
              <p className="text-xs text-steel">Captain {r.captain_name} · {r.tier} · <LocalTime iso={r.created_at} />{r.whatsapp && <> · <a className="text-gold hover:underline" href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp {r.whatsapp}</a></>}{r.discord && <> · Discord {r.discord}</>}</p></div>
            <div className="flex gap-2"><StatusBadge status={r.status} /><StatusBadge status={r.payment_status} /></div>
          </div>
          <details className="mt-3 text-sm"><summary className="cursor-pointer text-[11px] font-bold tracking-wider2 text-steel-light">PLAYERS ({r.players?.length ?? 0})</summary><ul className="mt-2 grid gap-1 sm:grid-cols-2">{(r.players ?? []).map((p, i) => <li key={i} className="font-mono text-xs text-steel-light">{String(p.nickname ?? '')} — UID {String(p.uid ?? '')}</li>)}</ul></details>
          <div className="mt-4 flex flex-wrap gap-2"><Op id={r.id} op="confirm" label="CONFIRM PAYMENT" /><Op id={r.id} op="reject" label="REJECT" danger /><Op id={r.id} op="refund" label="REFUND" /><Op id={r.id} op="pending" label="RESET" /></div>
        </article>))}</div>
    </main>
  );
}
