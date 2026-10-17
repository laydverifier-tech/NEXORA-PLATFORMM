import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { ConfirmButton } from '@/components/admin/form-kit';
import { Badge } from '@/components/ui/badge';
import { MediaForm } from './media-form';
import { deleteMedia } from './actions';

export default async function MediaAdmin({ searchParams }: { searchParams: { edit?: string; saved?: string } }) {
  const ctx = await adminPage('/admin/media'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('media_items').select('*').order('created_at', { ascending: false }).limit(200);
  const cur = isUuid(searchParams.edit) ? data?.find((m) => m.id === searchParams.edit) : undefined;
  const curId = cur?.id ?? '';
  async function del(fd: FormData) { 'use server'; fd.set('id', curId); await deleteMedia(fd); }
  return (
    <main className="max-w-4xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">MEDIA / HIGHLIGHTS</h1>
      {searchParams.saved && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Saved.</p>}
      <div className="border border-white/10 bg-ink-800/80 p-5"><h2 className="mb-3 text-[11px] font-bold tracking-wider2 text-gold">{cur ? 'EDIT VIDEO' : 'ADD VIDEO'}</h2><MediaForm key={cur?.id ?? 'new'} m={cur} />{cur && <div className="mt-4 flex gap-3"><Link href="/admin/media" className="self-center text-xs text-steel-light">CANCEL EDIT</Link><ConfirmButton label="DELETE" message="Delete this video?" action={del} /></div>}</div>
      <ul className="divide-y divide-white/10 border border-white/10">{(data ?? []).map((m) => <li key={m.id} className="flex items-center justify-between gap-3 p-4"><Link href={`/admin/media?edit=${m.id}`} className="font-bold hover:text-gold">{m.title}</Link><span className="flex gap-2"><Badge>{String(m.category).replace(/_/g, ' ')}</Badge><Badge tone={m.is_published ? 'success' : 'neutral'}>{m.is_published ? 'LIVE' : 'DRAFT'}</Badge></span></li>)}</ul>
    </main>
  );
}
