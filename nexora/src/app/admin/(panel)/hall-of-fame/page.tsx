import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { ConfirmButton } from '@/components/admin/form-kit';
import { HofForm } from './hof-form';
import { deleteHof } from './actions';

export default async function HofAdmin({ searchParams }: { searchParams: { edit?: string; saved?: string } }) {
  const ctx = await adminPage('/admin/hall-of-fame'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('hall_of_fame').select('*').order('event_date', { ascending: false });
  const cur = isUuid(searchParams.edit) ? data?.find((h) => h.id === searchParams.edit) : undefined;
  const curId = cur?.id ?? '';
  async function del(fd: FormData) { 'use server'; fd.set('id', curId); await deleteHof(fd); }
  return (
    <main className="max-w-4xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">HALL OF FAME</h1>
      {searchParams.saved && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Saved.</p>}
      <div className="border border-white/10 bg-ink-800/80 p-5"><h2 className="mb-3 text-[11px] font-bold tracking-wider2 text-gold">{cur ? 'EDIT' : 'ADD CHAMPION'}</h2><HofForm key={cur?.id ?? 'new'} h={cur} />{cur && <div className="mt-4 flex gap-3"><Link href="/admin/hall-of-fame" className="self-center text-xs text-steel-light">CANCEL EDIT</Link><ConfirmButton label="DELETE" message="Delete this entry?" action={del} /></div>}</div>
      <ul className="divide-y divide-white/10 border border-white/10">{(data ?? []).map((h) => <li key={h.id} className="p-4"><Link href={`/admin/hall-of-fame?edit=${h.id}`} className="font-bold hover:text-gold">{h.tournament_name} — {h.winner}</Link></li>)}</ul>
    </main>
  );
}
