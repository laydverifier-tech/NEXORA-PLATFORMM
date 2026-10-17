import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { ConfirmButton } from '@/components/admin/form-kit';
import { TournamentForm, type TForm } from '../tournament-form';
import { cancelTournament } from '../actions';

export default async function EditTournament({ params, searchParams }: { params: { id: string }; searchParams: { saved?: string } }) {
  const ctx = await adminPage(`/admin/tournaments/${params.id}`); if (!ctx || !isUuid(params.id)) notFound();
  const [{ data }, { data: prizes }] = await Promise.all([ctx.supabase.from('tournaments').select('*').eq('id', params.id).limit(1), ctx.supabase.from('prizes').select('placement,amount').eq('tournament_id', params.id)]);
  const t = data?.[0]; if (!t) notFound();
  const form: TForm = { ...t, prizes: Object.fromEntries((prizes ?? []).map((p) => [p.placement, Number(p.amount)])) };
  return (
    <main className="max-w-4xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">EDIT · {t.name}</h1>
      {searchParams.saved && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Saved.</p>}
      <TournamentForm t={form} />
      <div className="border-t border-white/10 pt-6"><h2 className="mb-3 text-[11px] font-bold tracking-wider2 text-red-400">DANGER ZONE</h2><form><input type="hidden" name="id" value={t.id} /></form>
        <CancelForm id={t.id} /></div>
    </main>
  );
}
function CancelForm({ id }: { id: string }) {
  async function act(fd: FormData) { 'use server'; fd.set('id', id); await cancelTournament(fd); }
  return <ConfirmButton label="CANCEL TOURNAMENT" message="Cancel this tournament? It disappears from the public site." action={act} />;
}
