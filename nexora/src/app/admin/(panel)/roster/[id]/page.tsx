import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { ConfirmButton } from '@/components/admin/form-kit';
import { RosterForm, type RForm } from '../roster-form';
import { deleteRoster } from '../actions';

export default async function EditPlayer({ params, searchParams }: { params: { id: string }; searchParams: { saved?: string } }) {
  const ctx = await adminPage(`/admin/roster/${params.id}`); if (!ctx || !isUuid(params.id)) notFound();
  const { data } = await ctx.supabase.from('roster_members').select('*').eq('id', params.id).limit(1);
  const p = data?.[0]; if (!p) notFound();
  async function del(fd: FormData) { 'use server'; fd.set('id', params.id); await deleteRoster(fd); }
  return (
    <main className="max-w-3xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">EDIT · {p.nickname}</h1>
      {searchParams.saved && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Saved.</p>}
      <RosterForm p={p as RForm} />
      <div className="border-t border-white/10 pt-6"><ConfirmButton label="DELETE PLAYER" message={`Delete ${p.nickname} permanently?`} action={del} /></div>
    </main>
  );
}
