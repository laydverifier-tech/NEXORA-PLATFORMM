import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { ConfirmButton } from '@/components/admin/form-kit';
import { Badge } from '@/components/ui/badge';
import { PartnerForm } from './partner-form';
import { deletePartner } from './actions';

export default async function PartnersAdmin({ searchParams }: { searchParams: { edit?: string; saved?: string } }) {
  const ctx = await adminPage('/admin/partners'); if (!ctx) notFound();
  const [{ data }, { data: clicks }] = await Promise.all([ctx.supabase.from('sponsors').select('*').order('created_at'), ctx.supabase.from('analytics_events').select('ref_id').eq('event_type', 'sponsor_click').limit(5000)]);
  const count: Record<string, number> = {}; (clicks ?? []).forEach((c) => { if (c.ref_id) count[c.ref_id] = (count[c.ref_id] ?? 0) + 1; });
  const cur = isUuid(searchParams.edit) ? data?.find((p) => p.id === searchParams.edit) : undefined;
  const curId = cur?.id ?? '';
  async function del(fd: FormData) { 'use server'; fd.set('id', curId); await deletePartner(fd); }
  return (
    <main className="max-w-4xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">PARTNERS / SPONSORS</h1>
      {searchParams.saved && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Saved.</p>}
      <div className="border border-white/10 bg-ink-800/80 p-5"><h2 className="mb-3 text-[11px] font-bold tracking-wider2 text-gold">{cur ? 'EDIT PARTNER' : 'ADD PARTNER'}</h2><PartnerForm key={cur?.id ?? 'new'} p={cur} />{cur && <div className="mt-4 flex gap-3"><Link href="/admin/partners" className="self-center text-xs text-steel-light">CANCEL EDIT</Link><ConfirmButton label="DELETE" message="Delete this partner?" action={del} /></div>}</div>
      <ul className="divide-y divide-white/10 border border-white/10">{(data ?? []).map((p) => <li key={p.id} className="flex items-center justify-between gap-3 p-4"><Link href={`/admin/partners?edit=${p.id}`} className="font-bold hover:text-gold">{p.name}</Link><span className="flex items-center gap-2 text-xs text-steel">{count[p.id] ?? 0} clicks{p.partner_type && <Badge>{p.partner_type}</Badge>}<Badge tone={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'ACTIVE' : 'HIDDEN'}</Badge></span></li>)}</ul>
      <p className="text-[11px] text-steel">Sponsor clicks are counted from /go/&lt;id&gt; redirects (real data only).</p>
    </main>
  );
}
